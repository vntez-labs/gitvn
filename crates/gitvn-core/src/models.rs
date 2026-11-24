use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashMap};

#[derive(Clone, Copy, Debug, Deserialize, Serialize, Eq, PartialEq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum Kind {
    Commits,
    Pulls,
    Issues,
    Reviews,
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Availability {
    Complete,
    Partial,
    #[default]
    Unavailable,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Visibility {
    Public,
    Private,
    Restricted,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum State {
    Open,
    Closed,
    Merged,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Repository {
    pub id: String,
    pub visibility: Visibility,
    pub owned: bool,
    pub fork: bool,
    pub archived: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Event {
    pub kind: Kind,
    pub id: String,
    pub at: i64,
    pub actor: String,
    pub repo: String,
    pub bot: Option<bool>,
    pub empty: Option<bool>,
    pub project_evidence_only: Option<bool>,
    pub original: Option<bool>,
    pub pr: Option<String>,
    pub pr_author: Option<String>,
    pub state: Option<State>,
    pub merger: Option<String>,
    pub independent_review: Option<bool>,
    pub resolved_by_pr: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DailyCommit {
    pub day: i64,
    pub repo: String,
    pub count: u32,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub collaboration: Option<CollaborationEvidence>,
    pub evaluated_at: i64,
    pub subject: String,
    pub repositories: Vec<Repository>,
    pub events: Vec<Event>,
    pub coverage: HashMap<String, Availability>,
    #[serde(default)]
    pub impact: HashMap<String, serde_json::Value>,
    pub daily_commits: Option<Vec<DailyCommit>>,
    pub calendar_days: Option<Vec<i64>>,
    #[serde(default)]
    pub limitations: Vec<String>,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Scale {
    Log,
    Linear,
    Piecewise,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub role: Option<HashMap<String, (f64, f64, Scale)>>,
    pub version: String,
    pub rank_thresholds: [f64; 7],
    pub burst: (u64, u64, f64, f64),
    pub qualification: (u64, usize, usize),
    pub categories: HashMap<String, HashMap<String, (f64, f64, Scale)>>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IssueResolution {
    pub id: String,
    pub author: String,
    pub closed_at: i64,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IntegrationEvidence {
    pub id: String,
    pub repo: String,
    pub author: Option<String>,
    pub merger: Option<String>,
    pub merged_at: i64,
    #[serde(default)]
    pub issues: Vec<IssueResolution>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CollaborationEvidence {
    pub integrations: Vec<IntegrationEvidence>,
    pub maintainer: Availability,
    pub issues: Availability,
    pub sources: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoleMetric {
    #[serde(flatten)]
    pub measurement: Measurement,
    pub id: &'static str,
    pub points: f64,
    pub maximum: f64,
    pub threshold: f64,
    pub scale: Scale,
    pub score_resolved: bool,
}

#[derive(Debug, Serialize)]
pub struct RoleComponent {
    pub points: f64,
    pub minimum: f64,
    pub maximum: f64,
    pub ceiling: f64,
    pub metrics: Vec<RoleMetric>,
}

#[derive(Debug, Serialize)]
pub struct SharedRole {
    pub points: f64,
    pub minimum: f64,
    pub maximum: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CollaborationScore {
    pub review: RoleComponent,
    pub contributor: RoleComponent,
    pub maintainer: RoleComponent,
    pub issues: RoleComponent,
    pub shared_role: SharedRole,
    pub points: f64,
    pub minimum: f64,
    pub maximum: f64,
    pub missing: Vec<&'static str>,
    pub sources: Vec<String>,
}

#[derive(Clone, Copy, Debug, Default, Serialize)]
pub struct Measurement {
    pub raw: Option<f64>,
    pub adjusted: Option<f64>,
    pub availability: Availability,
}

#[derive(Debug, Serialize)]
pub struct Adjustment {
    pub rule: &'static str,
    pub original: f64,
    pub adjusted: f64,
    pub weight: f64,
    pub explanation: &'static str,
    pub availability: Availability,
    pub evidence: BTreeMap<&'static str, u64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricScore {
    #[serde(flatten)]
    pub measurement: Measurement,
    pub id: &'static str,
    pub points: f64,
    pub score_resolved: bool,
    pub maximum: f64,
    pub threshold: f64,
    pub scale: Scale,
    pub window: &'static str,
    pub source: &'static str,
    pub explanation: &'static str,
}

#[derive(Debug, Serialize)]
pub struct CategoryScore {
    pub id: &'static str,
    pub points: f64,
    pub maximum: f64,
    pub metrics: Vec<MetricScore>,
}

#[derive(Debug, Serialize)]
pub struct Window {
    pub from: i64,
    pub to: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Completeness {
    pub status: &'static str,
    pub missing_metrics: Vec<&'static str>,
    pub limitations: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoreBounds {
    pub minimum: f64,
    pub maximum: f64,
    pub score_resolved: bool,
    pub rank_resolved: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoreResult {
    pub scoring_version: String,
    pub evaluated_at: i64,
    pub window: Window,
    pub total_score: f64,
    pub maximum_score: u8,
    pub rank: usize,
    pub next_rank: Option<usize>,
    pub rank_thresholds: [f64; 7],
    pub points_to_next_rank: f64,
    pub categories: Vec<CategoryScore>,
    pub adjustments: Vec<Adjustment>,
    pub completeness: Completeness,
    pub provisional: bool,
    pub bounds: ScoreBounds,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub collaboration: Option<CollaborationScore>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum InputError {
    Decode,
    Encode,
    Snapshot,
    Repository,
    Event,
    Aggregate,
    Config,
    Buffer,
}

impl std::fmt::Display for InputError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "Invalid scoring input: {self:?}")
    }
}

impl std::error::Error for InputError {}
