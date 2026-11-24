use crate::models::{Adjustment, Availability, Config, Event, Kind, Measurement, State};
use crate::normalization::{utc_day, utc_week, Normalized};
use std::collections::{BTreeMap, HashMap, HashSet};

#[derive(Default)]
struct Project {
    commits: u64,
    days: HashSet<i64>,
    weeks: HashSet<i64>,
    merged: bool,
}

#[derive(Default)]
struct Activity<'a> {
    projects: HashMap<&'a str, Project>,
    days: HashSet<i64>,
    weeks: HashSet<i64>,
    commits: HashMap<i64, u64>,
}

impl<'a> Activity<'a> {
    fn mark_day(&mut self, day: i64) {
        self.days.insert(day);
        self.weeks.insert(utc_week(day));
    }

    fn mark(&mut self, normalized: &Normalized, event: &'a Event, commits: u64, merged: bool) {
        self.mark_project(
            normalized,
            &event.repo,
            utc_day(event.at),
            commits,
            merged,
            event.original == Some(true),
        );
    }

    fn mark_project(
        &mut self,
        normalized: &Normalized,
        repo: &'a str,
        day: i64,
        commits: u64,
        merged: bool,
        original: bool,
    ) {
        self.mark_day(day);
        if normalized.repositories[repo].fork && !original {
            return;
        }
        let project = self.projects.entry(repo).or_default();
        project.days.insert(day);
        project.weeks.insert(utc_week(day));
        project.commits += commits;
        project.merged |= merged;
    }
}

pub struct Adjusted {
    pub reviewed_authors: usize,
    pub metrics: HashMap<&'static str, Measurement>,
    pub adjustments: Vec<Adjustment>,
}

impl Adjusted {
    fn record(
        &mut self,
        rule: &'static str,
        values: (f64, f64),
        explanation: &'static str,
        evidence: BTreeMap<&'static str, u64>,
        availability: Availability,
    ) {
        let (original, adjusted) = values;
        if original != adjusted {
            self.adjustments.push(Adjustment {
                rule,
                original,
                adjusted,
                explanation,
                evidence,
                availability,
                weight: if original == 0.0 {
                    0.0
                } else {
                    adjusted / original
                },
            });
        }
    }
}

pub fn adjust(normalized: &Normalized, config: &Config) -> Adjusted {
    let snapshot = normalized.snapshot;
    let mut activity = Activity::default();
    let mut reviews_by_pr: HashMap<&str, &Event> = HashMap::new();
    let mut raw: HashMap<Kind, u64> = HashMap::new();
    let (mut pulls, mut issues, mut merged, mut reviewed) = (0, 0, 0, 0);
    let mut linked_issues = 0;
    let (mut automated, mut empty, mut self_reviews, mut repeat_reviews) = (0, 0, 0, 0);

    let mut verified_empty_by_repo_day = HashMap::<(&str, i64), u64>::new();
    for event in normalized.events.values().copied() {
        if matches!(config.version.as_str(), "3.1.0" | "3.2.0")
            && event.project_evidence_only == Some(true)
        {
            continue;
        }
        if event.project_evidence_only != Some(true) {
            *raw.entry(event.kind).or_default() += 1;
        }
        if event.bot == Some(true) {
            automated += 1;
            continue;
        }
        match event.kind {
            Kind::Commits => {
                if event.empty == Some(true) {
                    if event.project_evidence_only == Some(true) {
                        *verified_empty_by_repo_day
                            .entry((&event.repo, utc_day(event.at)))
                            .or_default() += 1;
                    } else {
                        empty += 1;
                    }
                    continue;
                }
                if event.project_evidence_only != Some(true) {
                    *activity.commits.entry(utc_day(event.at)).or_default() += 1;
                }
                activity.mark(normalized, event, 1, false);
            }
            Kind::Reviews => {
                if event.pr_author.as_ref() == Some(&snapshot.subject) {
                    self_reviews += 1;
                    continue;
                }
                let Some(pr) = event.pr.as_deref() else {
                    continue;
                };
                if let Some(previous) = reviews_by_pr.get(pr) {
                    repeat_reviews += 1;
                    if (event.at, &event.id) >= (previous.at, &previous.id) {
                        continue;
                    }
                }
                reviews_by_pr.insert(pr, event);
            }
            Kind::Pulls => {
                pulls += 1;
                let is_merged = event.state == Some(State::Merged);
                if is_merged
                    && event
                        .merger
                        .as_ref()
                        .is_some_and(|id| id != &snapshot.subject)
                {
                    merged += 1;
                }
                if event.independent_review == Some(true) {
                    reviewed += 1;
                }
                activity.mark(normalized, event, 0, is_merged);
            }
            Kind::Issues => {
                issues += 1;
                if event.resolved_by_pr.is_some() {
                    linked_issues += 1;
                }
                activity.mark(normalized, event, 0, false);
            }
        }
    }
    let other_reviews = reviews_by_pr
        .values()
        .filter(|event| event.pr_author.is_some())
        .count();
    for event in reviews_by_pr.values() {
        activity.mark(normalized, event, 0, false);
    }
    for row in normalized
        .daily_commits
        .values()
        .filter(|row| row.count > 0)
    {
        *raw.entry(Kind::Commits).or_default() += u64::from(row.count);
        let excluded = verified_empty_by_repo_day
            .get(&(row.repo.as_str(), row.day))
            .copied()
            .unwrap_or_default()
            .min(u64::from(row.count));
        empty += excluded;
        *activity.commits.entry(row.day).or_default() += u64::from(row.count) - excluded;
        let project_commits = if matches!(config.version.as_str(), "3.1.0" | "3.2.0") {
            u64::from(row.count) - excluded
        } else {
            0
        };
        activity.mark_project(
            normalized,
            &row.repo,
            row.day,
            project_commits,
            false,
            false,
        );
    }

    if let Some(days) = snapshot
        .calendar_days
        .as_ref()
        .filter(|_| matches!(config.version.as_str(), "3.1.0" | "3.2.0"))
    {
        activity.days.clear();
        activity.weeks.clear();
        for &day in days {
            if (normalized.last_day - 364..=normalized.last_day).contains(&day) {
                activity.mark_day(day);
            }
        }
    }

    let (first, next, middle_weight, tail_weight) = config.burst;
    let (mut eligible_commits, mut weighted_commits, mut burst_days) = (0, 0.0, 0);
    let (mut streak, mut longest) = (0, 0);
    for day in normalized.last_day - 364..=normalized.last_day {
        let n = activity.commits.get(&day).copied().unwrap_or_default();
        eligible_commits += n;
        if n > first {
            burst_days += 1;
        }
        let excess = n.saturating_sub(first);
        weighted_commits += n.min(first) as f64
            + excess.min(next) as f64 * middle_weight
            + excess.saturating_sub(next) as f64 * tail_weight;
        streak = if activity.days.contains(&day) {
            streak + 1
        } else {
            0
        };
        longest = longest.max(streak);
    }

    let (minimum_commits, minimum_days, sustained_weeks) = config.qualification;
    let (mut qualified, mut sustained, mut external) = (0, 0, 0);
    for (id, project) in &activity.projects {
        if project.merged
            || (project.commits >= minimum_commits && project.days.len() >= minimum_days)
        {
            qualified += 1;
            if project.weeks.len() >= sustained_weeks {
                sustained += 1;
            }
            if !normalized.repositories[id].owned {
                external += 1;
            }
        }
    }

    let availability = |key: &str| snapshot.coverage.get(key).copied().unwrap_or_default();
    let reviewed_authors = reviews_by_pr
        .values()
        .filter_map(|event| event.pr_author.as_deref())
        .collect::<HashSet<_>>()
        .len();
    let mut result = Adjusted {
        reviewed_authors,
        metrics: HashMap::new(),
        adjustments: Vec::new(),
    };
    let mut measure = |key, raw, adjusted| {
        let availability = availability(key);
        if availability != Availability::Unavailable {
            result.metrics.insert(
                key,
                Measurement {
                    raw: Some(raw),
                    adjusted: Some(adjusted),
                    availability,
                },
            );
        }
    };
    for id in ["stars", "followers", "forks", "releases"] {
        if let Some(value) = snapshot
            .impact
            .get(id)
            .and_then(serde_json::Value::as_f64)
            .filter(|value| {
                *value >= 0.0 && *value <= 9_007_199_254_740_991.0 && value.fract() == 0.0
            })
        {
            measure(id, value, value);
        }
    }
    let raw_count = |kind| raw.get(&kind).copied().unwrap_or_default() as f64;
    measure("commits", raw_count(Kind::Commits), weighted_commits);
    measure("pulls", raw_count(Kind::Pulls), pulls as f64);
    measure("issues", raw_count(Kind::Issues), issues as f64);
    measure(
        "reviews",
        raw_count(Kind::Reviews),
        reviews_by_pr.len() as f64,
    );
    for (id, n) in [
        ("activeWeeks", activity.weeks.len()),
        ("activeDays", activity.days.len()),
        ("streak", longest),
        ("sustained", sustained),
        ("external", external),
        ("merged", merged),
        ("reviewed", reviewed),
        ("otherReviews", other_reviews),
        ("linkedIssues", linked_issues),
    ] {
        measure(id, n as f64, n as f64);
    }
    measure(
        "qualified",
        activity.projects.len() as f64,
        qualified as f64,
    );

    let distinct = (normalized.events.len() + normalized.daily_commits.len()) as f64;
    result.record(
        "duplicate-events",
        (distinct + normalized.duplicates as f64, distinct),
        "Gộp các bản ghi trùng theo định danh ổn định.",
        BTreeMap::from([("duplicates", normalized.duplicates)]),
        Availability::Partial,
    );
    result.record(
        "automated-actors",
        (automated as f64, 0.0),
        "Loại hoạt động của bot đã xác định.",
        BTreeMap::from([("automated", automated)]),
        Availability::Partial,
    );
    result.record(
        "confirmed-empty-commits",
        (empty as f64, 0.0),
        "Loại commit được xác nhận không có thay đổi.",
        BTreeMap::from([("empty", empty)]),
        Availability::Partial,
    );
    result.record(
        "daily-commit-burst",
        (eligible_commits as f64, weighted_commits),
        "Giảm trọng số cho phần commit vượt ngưỡng trong cùng ngày UTC.",
        BTreeMap::from([("burstDays", burst_days)]),
        availability("commits"),
    );
    let raw_reviews = raw_count(Kind::Reviews);
    result.record(
        "review-per-pr",
        (
            raw_reviews,
            raw_reviews - (self_reviews + repeat_reviews) as f64,
        ),
        "Giới hạn một lượt đánh giá mỗi PR và bỏ qua tự đánh giá.",
        BTreeMap::from([
            ("selfReviews", self_reviews),
            ("repeatReviews", repeat_reviews),
        ]),
        availability("reviews"),
    );
    result.record(
        "repository-qualification",
        (activity.projects.len() as f64, qualified as f64),
        "Dự án cần đủ commit và ngày hoạt động hoặc có PR đã hợp nhất.",
        BTreeMap::from([
            ("minimumCommits", minimum_commits),
            ("minimumDays", minimum_days as u64),
        ]),
        availability("qualified"),
    );
    result
}
