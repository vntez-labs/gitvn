# V3.2 role-aware collaboration

V3.1 gave most outcome points to authors of PRs independently merged or reviewed. Reviewing and integrating another developer's changes could earn review points, while the integration itself was uncredited. Ownership, history shape and repository counts do not establish who performed a merge.

| Block | Scored evidence | Weights / thresholds |
|---|---|---|
| Review | Unique PRs by another confirmed human and their unique authors | 4 / 100 PRs, 1 / 20 authors |
| Contributor | Own PRs independently merged and own PRs independently reviewed | 5 / 50 merges, 2 / 30 reviewed PRs |
| Maintainer | Other humans' PRs merged by the evaluated human and their unique authors | 5 / 50 merges, 2 / 20 authors |
| Issue resolution | Unique issues opened by another human and demonstrably closed by an authored or maintained PR | 3 / 30 issues |

`review + max(contributor, maintainer) + resolution` caps collaboration at 15 and the entire score at 100. Every metric uses the existing bounded logarithmic scaler initially. The configurable inputs are in [role-defaults.json](../src/lib/scoring/role-defaults.json). Block ceilings stay at 5/7/7/3. Non-collaboration weights and inputs, rank names, thresholds and artwork match V3.1. Lower-tier milestone artwork is presented in smaller neutral frames.

## Evidence and bounds

An independent merge requires a confirmed human author and a distinct confirmed human merger. A maintained PR must have a merge timestamp in the rolling interval; a closure must also be in that interval and at or after the merge. Closure requires the latest visible close event to identify the actual PR. A self-merge can count as ordinary contribution activity. A self-authored PR can still earn independent review points and can close another human's issue.

Review and integration can both count because they measure distinct actions. Duplicate PR and issue IDs contribute once. Repeated work with one teammate can reach the PR-volume ceilings and earns less of the separate author-diversity points. There is no pair-based penalty. In a contradictory duplicate maintainer record, the core picks a deterministic single author for the PR; any genuinely corrected identity may change diversity credit. Bot actors and missing identities never substitute for a human match.

Each block publishes observed points and an interval. The shared bounds are the maxima of the respective role lower and upper bounds. If one path reaches seven, uncertainty in the other path cannot make the shared role provisional. Search coverage never verifies a universal zero. A null raw value denotes unavailable evidence, and a partial zero denotes a sample with no confirmed eligible records.

Rust and TypeScript accept the same typed batch contract. API orchestration stays in TypeScript. Standalone callers choose 3.2 explicitly by passing `roleConfig`; default standalone scoring still supports V3.0 fixtures. The collector version remains separate from the scoring version.

## Migration

V3.2 is the Insights default. Set `GITVN_SCORING_ROLE=0` for V3.1 with its aggregate collector. `GITVN_COLLECTOR_VERSION=3.0` still selects V3.0 and `GITVN_SCORING_V3=0` selects legacy scoring. Scoring caches include the configuration and version. Candidate caches are separate and use the authorization scope and evaluation window.
