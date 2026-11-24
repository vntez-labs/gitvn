use crate::anti_abuse::Adjusted;
use crate::models::{
    Availability, CategoryScore, Completeness, Config, InputError, MetricScore, Scale, ScoreBounds,
    ScoreResult, Window,
};
use crate::normalization::Normalized;
use std::collections::HashMap;
use std::sync::OnceLock;

const CATEGORIES: [(&str, &[&str]); 5] = [
    ("impact", &["stars", "followers", "forks", "releases"]),
    ("activity", &["commits", "pulls", "issues", "reviews"]),
    ("consistency", &["activeWeeks", "activeDays", "streak"]),
    ("coverage", &["qualified", "sustained", "external"]),
    (
        "collaboration",
        &["merged", "reviewed", "otherReviews", "linkedIssues"],
    ),
];

static LABELS: OnceLock<HashMap<&str, &str>> = OnceLock::new();
static DEFAULTS: OnceLock<Config> = OnceLock::new();

pub fn default_config() -> &'static Config {
    DEFAULTS.get_or_init(|| {
        serde_json::from_str(include_str!("../../../src/lib/scoring/defaults.json"))
            .expect("checked-in default configuration")
    })
}

pub(crate) fn round(value: f64) -> f64 {
    (value * 100.0).round() / 100.0
}

pub fn validate_config(config: &Config) -> Result<(), InputError> {
    if config.version == "3.2.0" && !crate::roles::valid_config(config.role.as_ref()) {
        return Err(InputError::Config);
    }
    let ranks = &config.rank_thresholds;
    let (first, next, middle, tail) = config.burst;
    let (commits, days, weeks) = config.qualification;
    const MAX_SAFE_INTEGER: u64 = 9_007_199_254_740_991;
    if config.version.is_empty()
        || ranks[0] != 0.0
        || ranks
            .iter()
            .any(|&rank| !rank.is_finite() || rank > 100.0 || round(rank) != rank)
        || ranks.windows(2).any(|pair| pair[0] >= pair[1])
        || first > MAX_SAFE_INTEGER
        || next > MAX_SAFE_INTEGER
        || !(0.0..=1.0).contains(&middle)
        || !(0.0..=middle).contains(&tail)
        || commits == 0
        || commits > MAX_SAFE_INTEGER
        || days == 0
        || weeks == 0
    {
        return Err(InputError::Config);
    }
    let mut sum = 0.0;
    let mut collaboration_maximum = 0.0;
    for (category, ids) in CATEGORIES {
        let entries = config.categories.get(category).ok_or(InputError::Config)?;
        for id in ids {
            let &(maximum, threshold, _) = entries.get(*id).ok_or(InputError::Config)?;
            if !maximum.is_finite()
                || maximum < 0.0
                || round(maximum) != maximum
                || !threshold.is_finite()
                || threshold <= 0.0
            {
                return Err(InputError::Config);
            }
            sum += maximum;
            if category == "collaboration" {
                collaboration_maximum += maximum;
            }
        }
    }
    if (config.version == "3.2.0" && (collaboration_maximum - 15.0_f64).abs() > 1e-9)
        || (sum - 100.0_f64).abs() > 1e-9
    {
        return Err(InputError::Config);
    }
    Ok(())
}

pub(crate) fn scale(value: f64, maximum: f64, threshold: f64, method: Scale) -> f64 {
    let ratio = (value / threshold).min(1.0);
    let fraction = match method {
        Scale::Log => value.min(threshold).ln_1p() / threshold.ln_1p(),
        Scale::Linear => ratio,
        Scale::Piecewise if ratio <= 0.5 => ratio * 1.5,
        Scale::Piecewise => 0.75 + (ratio - 0.5) * 0.5,
    };
    maximum * fraction
}

pub fn calculate(normalized: &Normalized, adjusted: Adjusted, config: &Config) -> ScoreResult {
    let snapshot = normalized.snapshot;
    let labels = LABELS.get_or_init(|| {
        serde_json::from_str(include_str!("../../../src/lib/scoring/labels.json"))
            .expect("checked-in labels")
    });
    let aggregate_mode = matches!(config.version.as_str(), "3.1.0" | "3.2.0");
    let collaboration = config
        .role
        .as_ref()
        .filter(|_| config.version == "3.2.0")
        .map(|role| crate::roles::score_roles(normalized, &adjusted, role));
    let supports_floor = |id: &str| {
        aggregate_mode
            && (id == "commits" && snapshot.daily_commits.is_some()
                || matches!(id, "qualified" | "sustained" | "external"))
    };
    let mut missing_metrics = Vec::new();
    let mut observed = 0;
    let categories: Vec<_> = CATEGORIES
        .into_iter()
        .map(|(category, ids)| {
            if category == "collaboration" {
                if let Some(role) = &collaboration {
                    missing_metrics.extend(&role.missing);
                    observed += [
                        &role.review,
                        &role.contributor,
                        &role.maintainer,
                        &role.issues,
                    ]
                    .iter()
                    .flat_map(|component| &component.metrics)
                    .filter(|metric| metric.measurement.raw.is_some())
                    .count();
                    return CategoryScore {
                        id: category,
                        metrics: Vec::new(),
                        points: role.points,
                        maximum: 15.0,
                    };
                }
            }
            let metrics: Vec<_> = ids
                .iter()
                .map(|&id| {
                    let measurement = adjusted.metrics.get(id).copied().unwrap_or_default();
                    let (maximum, threshold, method) = config.categories[category][id];
                    let score_resolved = measurement.availability == Availability::Complete
                        || (measurement.availability == Availability::Partial
                            && supports_floor(id)
                            && measurement.adjusted.unwrap_or_default() >= threshold);
                    if !score_resolved {
                        missing_metrics.push(id);
                    }
                    if measurement.adjusted.is_some() {
                        observed += 1;
                    }
                    MetricScore {
                        id,
                        score_resolved,
                        maximum,
                        threshold,
                        measurement,
                        scale: method,
                        explanation: labels[id],
                        points: round(scale(
                            measurement.adjusted.unwrap_or_default(),
                            maximum,
                            threshold,
                            method,
                        )),
                        window: if category == "impact" {
                            "lifetime"
                        } else {
                            "365-days"
                        },
                        source: if category == "impact" {
                            "github-impact-snapshot"
                        } else if id == "commits" && snapshot.daily_commits.is_some() {
                            "github-daily-commit-aggregate"
                        } else if category == "consistency" && snapshot.calendar_days.is_some() {
                            "github-contribution-calendar"
                        } else {
                            "github-activity-evidence"
                        },
                    }
                })
                .collect();
            CategoryScore {
                id: category,
                points: round(metrics.iter().map(|metric| metric.points).sum()),
                maximum: round(metrics.iter().map(|metric| metric.maximum).sum()),
                metrics,
            }
        })
        .collect();
    let mut limitations = snapshot.limitations.clone();
    if !missing_metrics.is_empty() {
        limitations.push(
            "Chỉ tính điểm từ dữ liệu quan sát được. Phần điểm thiếu không được phân bổ lại."
                .into(),
        );
    }
    let metrics = || categories.iter().flat_map(|category| &category.metrics);
    let minimum = round(
        metrics()
            .filter(|m| m.score_resolved || supports_floor(m.id))
            .map(|m| m.points)
            .sum(),
    );
    let maximum = round(
        metrics()
            .map(|m| {
                if m.score_resolved {
                    m.points
                } else {
                    m.maximum
                }
            })
            .sum(),
    );
    let rank_for = |points| {
        config
            .rank_thresholds
            .iter()
            .rposition(|threshold| points >= *threshold)
    };
    let minimum = round(minimum + collaboration.as_ref().map_or(0.0, |role| role.minimum));
    let maximum = round(maximum + collaboration.as_ref().map_or(0.0, |role| role.maximum));
    let bounds = ScoreBounds {
        minimum,
        maximum,
        score_resolved: minimum == maximum,
        rank_resolved: rank_for(minimum) == rank_for(maximum),
    };
    let provisional = if aggregate_mode {
        !bounds.score_resolved
    } else {
        !missing_metrics.is_empty() || !limitations.is_empty()
    };
    let total_score = round(
        categories
            .iter()
            .map(|category| category.points)
            .sum::<f64>()
            .clamp(0.0, 100.0),
    );
    let rank = config
        .rank_thresholds
        .iter()
        .rposition(|threshold| total_score >= *threshold)
        .unwrap_or(0);
    let next_rank = (rank < 6).then_some(rank + 1);
    ScoreResult {
        scoring_version: config.version.clone(),
        evaluated_at: snapshot.evaluated_at,
        window: Window {
            from: normalized.from,
            to: snapshot.evaluated_at,
        },
        total_score,
        maximum_score: 100,
        rank,
        next_rank,
        rank_thresholds: config.rank_thresholds,
        points_to_next_rank: next_rank.map_or(0.0, |next| {
            round(config.rank_thresholds[next] - total_score)
        }),
        categories,
        adjustments: adjusted.adjustments,
        completeness: Completeness {
            status: if observed == 0 {
                "insufficient"
            } else if provisional {
                "partial"
            } else {
                "complete"
            },
            missing_metrics,
            limitations,
        },
        provisional,
        bounds,
        collaboration,
    }
}
