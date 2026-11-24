# Scoring V3 activity adjustments

| Evidence | Treatment |
|---|---|
| Repeated stable IDs | One contribution per GitHub node ID or case-normalized commit object ID. Reassigned repository names have no effect when the node ID is stable. |
| Confirmed empty commit | Excluded when explicit evidence identifies it as empty. Missing diffs have no effect. |
| Confirmed automated actor | Excluded when reliable provider metadata identifies a bot. |
| Commit bursts | First 10 commits per UTC day retain full weight. Next 20 count at 50%. Remaining commits count at 10%. The cap applies across repositories. |
| Repeated and self reviews | One scored review per target PR for the profile subject. Reviews of the subject's own PR are excluded. |
| PR outcomes | Opened, closed and merged PRs count once for activity. Independently merged and reviewed credit needs distinct human actor evidence. A self-merge can still qualify the project. |
| Project qualification | Five distinct commits across at least three distinct activity dates, or at least one merged PR. Sustained projects need four active weeks. Forks require observed original data. |

Adjustments expose rule identifiers, before and after values, the weight ratio, evidence counts, and availability. Weight reductions describe observed activity patterns. There is no global suspicion score. A burst can reflect legitimate deadlines, releases or migration activity. Stable IDs prevent repeated observations from earning extra points, and repository qualification can still favor particular workflows such as merged PRs over direct pushes.

The production adapter receives GitHub's daily commit aggregates for public repositories. It can apply burst weighting to those counts but cannot infer empty commits, precise attribution or shared object IDs across repositories. A bounded history batch provides distinct OIDs and tree IDs where daily counts reconcile. Project-only evidence can support qualification and remove confirmed empty commits without adding those commits again to volume. Unresolved coverage and volume remain provisional. Commit submissions and co-authorship remain governed by GitHub's aggregate attribution. No line counts, source scans, comment-length thresholds, commit-message heuristics, or AI detectors enter the formula.
