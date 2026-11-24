use crate::{
    anti_abuse::Adjusted,
    models::{
        Availability, CollaborationScore, Measurement, RoleComponent, RoleMetric, Scale,
        SharedRole, Visibility,
    },
    normalization::Normalized,
    scoring::{round, scale},
};
use std::collections::{HashMap, HashSet};

const GROUPS: [(&[&str], f64); 4] = [
    (&["reviewPrs", "reviewAuthors"], 5.0),
    (&["contributorMerges", "contributorReviews"], 7.0),
    (&["maintainerMerges", "maintainerAuthors"], 7.0),
    (&["resolvedIssues"], 3.0),
];

pub fn valid_config(role: Option<&HashMap<String, (f64, f64, Scale)>>) -> bool {
    role.is_some_and(|role| {
        GROUPS.into_iter().all(|(ids, ceiling)| {
            let mut sum = 0.0;
            for id in ids {
                let Some(&(maximum, threshold, _)) = role.get(*id) else {
                    return false;
                };
                if !maximum.is_finite()
                    || maximum < 0.0
                    || round(maximum) != maximum
                    || !threshold.is_finite()
                    || threshold <= 0.0
                {
                    return false;
                }
                sum += maximum;
            }
            sum == ceiling
        })
    })
}

pub fn score_roles(
    normalized: &Normalized,
    adjusted: &Adjusted,
    model: &HashMap<String, (f64, f64, Scale)>,
) -> CollaborationScore {
    let snapshot = normalized.snapshot;
    let subject = snapshot.subject.as_str();
    let in_window = |at| (normalized.from..=snapshot.evaluated_at).contains(&at);
    let mut contributor_ids = HashSet::new();
    for event in normalized.events.values() {
        if event.kind == crate::models::Kind::Pulls
            && event.bot != Some(true)
            && event.state == Some(crate::models::State::Merged)
            && event
                .merger
                .as_deref()
                .is_some_and(|merger| merger != subject)
        {
            contributor_ids.insert(event.id.as_str());
        }
    }
    let mut integrated = HashMap::<&str, &str>::new();
    let mut issues = HashSet::new();
    let evidence = snapshot.collaboration.as_ref();
    if let Some(evidence) = evidence {
        for entry in &evidence.integrations {
            let Some(author) = entry.author.as_deref().filter(|author| !author.is_empty()) else {
                continue;
            };
            if entry.id.is_empty()
                || !in_window(entry.merged_at)
                || !normalized
                    .repositories
                    .get(entry.repo.as_str())
                    .is_some_and(|repo| repo.visibility == Visibility::Public)
            {
                continue;
            }
            if author == subject
                && entry
                    .merger
                    .as_deref()
                    .is_some_and(|merger| merger != subject)
            {
                contributor_ids.insert(entry.id.as_str());
            }
            let maintained = author != subject && entry.merger.as_deref() == Some(subject);
            if maintained {
                let old = integrated.entry(&entry.id).or_insert(author);
                *old = (*old).min(author);
            }
            if maintained || author == subject {
                for issue in &entry.issues {
                    if !issue.id.is_empty()
                        && !issue.author.is_empty()
                        && issue.author != subject
                        && in_window(issue.closed_at)
                        && issue.closed_at >= entry.merged_at
                    {
                        issues.insert(&issue.id);
                    }
                }
            }
        }
    }
    let get = |id| adjusted.metrics.get(id).copied().unwrap_or_default();
    let measure = |n: usize, availability| {
        if availability == Availability::Unavailable {
            Measurement::default()
        } else {
            Measurement {
                raw: Some(n as f64),
                adjusted: Some(n as f64),
                availability,
            }
        }
    };
    let maintainer_availability =
        evidence.map_or(Availability::Unavailable, |data| data.maintainer);
    let values = HashMap::from([
        ("reviewPrs", get("otherReviews")),
        (
            "reviewAuthors",
            measure(adjusted.reviewed_authors, get("otherReviews").availability),
        ),
        (
            "contributorMerges",
            measure(
                contributor_ids.len(),
                adjusted.metrics.get("merged").map_or(
                    if contributor_ids.is_empty() {
                        Availability::Unavailable
                    } else {
                        Availability::Partial
                    },
                    |measurement| measurement.availability,
                ),
            ),
        ),
        ("contributorReviews", get("reviewed")),
        (
            "maintainerMerges",
            measure(integrated.len(), maintainer_availability),
        ),
        (
            "maintainerAuthors",
            measure(
                integrated.values().collect::<HashSet<_>>().len(),
                maintainer_availability,
            ),
        ),
        (
            "resolvedIssues",
            measure(
                issues.len(),
                evidence.map_or(Availability::Unavailable, |data| data.issues),
            ),
        ),
    ]);
    let [review, contributor, maintainer, issues] = GROUPS.map(|(ids, ceiling)| {
        let metrics: Vec<_> = ids
            .iter()
            .map(|&id| {
                let measurement = values[id];
                let (maximum, threshold, method) = model[id];
                let value = measurement.adjusted.unwrap_or_default();
                RoleMetric {
                    id,
                    measurement,
                    maximum,
                    threshold,
                    scale: method,
                    points: round(scale(value, maximum, threshold, method)),
                    score_resolved: measurement.availability == Availability::Complete
                        || value >= threshold,
                }
            })
            .collect();
        let points = round(metrics.iter().map(|metric| metric.points).sum());
        let maximum = round(
            metrics
                .iter()
                .map(|metric| {
                    if metric.score_resolved {
                        metric.points
                    } else {
                        metric.maximum
                    }
                })
                .sum(),
        );
        RoleComponent {
            points,
            minimum: points,
            maximum,
            ceiling,
            metrics,
        }
    });
    let shared_role = SharedRole {
        points: contributor.points.max(maintainer.points),
        minimum: contributor.minimum.max(maintainer.minimum),
        maximum: contributor.maximum.max(maintainer.maximum),
    };
    let mut missing = Vec::new();
    for (component, shared) in [
        (&review, false),
        (&issues, false),
        (&contributor, true),
        (&maintainer, true),
    ] {
        if shared && component.maximum <= shared_role.minimum {
            continue;
        }
        missing.extend(
            component
                .metrics
                .iter()
                .filter(|metric| !metric.score_resolved)
                .map(|metric| metric.id),
        );
    }
    CollaborationScore {
        points: round(review.points + shared_role.points + issues.points),
        minimum: round(review.minimum + shared_role.minimum + issues.minimum),
        maximum: round(review.maximum + shared_role.maximum + issues.maximum),
        review,
        contributor,
        maintainer,
        issues,
        shared_role,
        missing,
        sources: evidence.map_or_else(Vec::new, |data| data.sources.clone()),
    }
}
