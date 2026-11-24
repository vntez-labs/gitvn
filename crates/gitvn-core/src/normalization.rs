use crate::models::{DailyCommit, Event, InputError, Kind, Repository, Snapshot, Visibility};
use std::collections::{hash_map::Entry, HashMap};

pub const DAY: i64 = 86_400_000;

pub fn utc_day(at: i64) -> i64 {
    at.div_euclid(DAY)
}

pub fn utc_week(day: i64) -> i64 {
    (day + 3).div_euclid(7)
}

pub struct Normalized<'a> {
    pub snapshot: &'a Snapshot,
    pub from: i64,
    pub last_day: i64,
    pub repositories: HashMap<&'a str, &'a Repository>,
    pub events: HashMap<(Kind, String), &'a Event>,
    pub daily_commits: HashMap<(&'a str, i64), &'a DailyCommit>,
    pub duplicates: u64,
}

fn valid_id(id: &str) -> bool {
    !id.is_empty() && id.bytes().all(|byte| (b'!'..=b'~').contains(&byte))
}

pub fn normalize(snapshot: &Snapshot) -> Result<Normalized<'_>, InputError> {
    if !(-8_640_000_000_000_000..=8_640_000_000_000_000).contains(&snapshot.evaluated_at)
        || !valid_id(&snapshot.subject)
    {
        return Err(InputError::Snapshot);
    }
    let last_day = utc_day(snapshot.evaluated_at);
    let from = (last_day - 364) * DAY;
    let mut repositories = HashMap::new();
    for repo in &snapshot.repositories {
        if !valid_id(&repo.id) || repositories.insert(repo.id.as_str(), repo).is_some() {
            return Err(InputError::Repository);
        }
    }
    let mut events = HashMap::new();
    let mut duplicates = 0;
    for event in &snapshot.events {
        let repo = repositories
            .get(event.repo.as_str())
            .ok_or(InputError::Event)?;
        if event.actor != snapshot.subject
            || !valid_id(&event.id)
            || !(-9_007_199_254_740_991..=9_007_199_254_740_991).contains(&event.at)
            || [
                &event.pr,
                &event.pr_author,
                &event.merger,
                &event.resolved_by_pr,
            ]
            .into_iter()
            .flatten()
            .any(|id| !valid_id(id))
        {
            return Err(InputError::Event);
        }
        let project_only = event.project_evidence_only == Some(true);
        if (project_only && event.kind != Kind::Commits)
            || (event.kind == Kind::Commits && project_only != snapshot.daily_commits.is_some())
        {
            return Err(InputError::Aggregate);
        }
        if event.at < from
            || event.at > snapshot.evaluated_at
            || repo.visibility != Visibility::Public
        {
            continue;
        }
        let id = if event.kind == Kind::Commits {
            event.id.to_ascii_lowercase()
        } else {
            event.id.clone()
        };
        match events.entry((event.kind, id)) {
            Entry::Vacant(entry) => {
                entry.insert(event);
            }
            Entry::Occupied(mut entry) => {
                duplicates += 1;
                let previous: &Event = entry.get();
                if previous.repo == event.repo && !same_event(previous, event)
                    || previous.repo != event.repo && event.kind != Kind::Commits
                {
                    return Err(InputError::Event);
                }
                let priority = event.original.unwrap_or(false);
                let old_priority = previous.original.unwrap_or(false);
                if (priority && !old_priority)
                    || (priority == old_priority && event.repo < previous.repo)
                {
                    entry.insert(event);
                }
            }
        }
    }

    let mut daily_commits = HashMap::new();
    for row in snapshot.daily_commits.iter().flatten() {
        let repo = repositories
            .get(row.repo.as_str())
            .ok_or(InputError::Aggregate)?;
        if row.count > i32::MAX as u32 {
            return Err(InputError::Aggregate);
        }
        if repo.visibility != Visibility::Public || !(last_day - 364..=last_day).contains(&row.day)
        {
            continue;
        }
        if let Some(previous) = daily_commits.insert((row.repo.as_str(), row.day), row) {
            if previous.count != row.count {
                return Err(InputError::Aggregate);
            }
            duplicates += 1;
        }
    }
    Ok(Normalized {
        snapshot,
        from,
        last_day,
        repositories,
        events,
        daily_commits,
        duplicates,
    })
}

fn same_event(a: &Event, b: &Event) -> bool {
    a.at == b.at
        && a.actor == b.actor
        && a.bot == b.bot
        && a.empty == b.empty
        && a.project_evidence_only == b.project_evidence_only
        && a.original == b.original
        && a.pr == b.pr
        && a.pr_author == b.pr_author
        && a.state == b.state
        && a.merger == b.merger
        && a.independent_review == b.independent_review
        && a.resolved_by_pr == b.resolved_by_pr
}
