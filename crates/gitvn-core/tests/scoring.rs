use gitvn_core::{models::InputError, score, scoring::default_config};
use serde_json::json;

#[test]
fn empty_with_observed_counts_differs_from_missing_data() {
    let input = serde_json::from_value(json!({
        "subject": "subject", "evaluatedAt": 0,
        "repositories": [], "events": [],
        "coverage": { "commits": "complete" }
    }))
    .unwrap();
    let result = score(&input, default_config()).unwrap();
    assert_eq!(result.total_score, 0.0);
    assert_eq!(result.rank, 0);
    assert_eq!(result.points_to_next_rank, 15.0);
    let metrics = &result.categories[1].metrics;
    assert_eq!(metrics[0].measurement.raw, Some(0.0));
    assert_eq!(metrics[1].measurement.raw, None);
    assert!(result.provisional);
}

#[test]
fn rejects_ambiguous_commit_input() {
    let input = serde_json::from_value(json!({
        "subject": "subject", "evaluatedAt": 0, "coverage": {},
        "repositories": [{ "id": "repo", "visibility": "public", "fork": false, "owned": true }],
        "events": [{ "kind": "commits", "id": "sha", "repo": "repo", "at": 0, "actor": "subject" }],
        "dailyCommits": []
    }))
    .unwrap();
    assert!(matches!(
        score(&input, default_config()),
        Err(InputError::Aggregate)
    ));
}
