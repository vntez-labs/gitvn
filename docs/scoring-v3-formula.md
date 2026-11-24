# Scoring V3 formula

Version 3.0.0 defaults are in [defaults.json](../src/lib/scoring/defaults.json). The weights and thresholds are experimental. Each metric scales a nonnegative observed value against its threshold and maximum.

- Linear scaling multiplies the maximum by `min(1, value / threshold)`.
- Log scaling multiplies the maximum by `ln(1 + min(value, threshold)) / ln(1 + threshold)`.
- Piecewise scaling reaches 75% at half the threshold and 100% at the threshold, with linear segments between these points and zero.

Thresholds must be finite and strictly positive. Metric maxima use hundredth-point precision and must sum to 100. The engine rounds metric points to hundredths before summing categories and the total. The same total determines the displayed score, rank, and exact distance to the next tier. The maximum rank returns no next rank and zero points remaining to a tier.

| Category | Metric maxima and saturation thresholds | Scale |
|---|---|---|
| Community impact (20) | Stars 10 / 500, followers 4 / 200, forks 4 / 100, repositories with releases 2 / 10 | Log |
| Contribution activity (30) | Adjusted commits 12 / 1500, PRs 8 / 100, issues 4 / 50, reviewed PRs 6 / 150 | Log |
| Consistency and discipline (25) | Active weeks 12 / 48, active days 10 / 220, longest streak 3 / 30 | Linear |
| Project coverage (10) | Qualified repositories 5 / 8, sustained qualified repositories 3 / 4, external qualified repositories 2 / 8 | Log |
| Collaboration (15) | Independently merged PRs 5 / 40, independently reviewed PRs 3 / 40, other developers' PRs reviewed 4 / 100, issues resolved through another developer's PR 3 / 25 | Log |

Impact is a lifetime snapshot of current followers and public, individually owned non-fork repositories. Forks count GitHub's fork total on original repositories. Releases count repositories with at least one observed published release. No historical growth is inferred.

Activity covers 365 UTC calendar dates including the evaluation date, ending at the explicit evaluation timestamp. A Monday–Sunday UTC week with at least one eligible day counts once, including partial edge weeks. A streak is consecutive active UTC dates. The 3-point streak cap limits the effect of rest days. The points describe observable activity and have no engineering ability interpretation.

Missing measurements have null raw and adjusted values and earn zero points. Observed zero carries a numeric zero and an availability state. Partial evidence earns its supported lower-bound points. Missing points retain their original maxima and never transfer to other categories.

An authored PR contributes to volume once and can separately earn bounded outcome credit with evidence of a human merger or reviewer. A submitted review can count toward volume and, when the PR author is confirmed as another human, collaboration. Distinctness and metric caps bound these overlaps. An issue opened in the window can also earn outcome credit when a public, merged PR authored by another human directly closed it in that window.

The current ranks use cutoffs 0, 15, 30, 50, 70, 85, and 92. They retain the existing names and assets.
