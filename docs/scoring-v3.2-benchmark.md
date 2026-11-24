# V3.2 verification and benchmarks

Run the production build, then `GITVN_BENCH_ROLES=1 node scripts/scoring-collection-benchmark.mjs`. The runner freezes the evaluation time, uses one GitHub CLI authorization scope, and compares the V3.1 rollback flag with V3.2. Reported costs come from the provider's `rateLimit.cost` field. Endpoint wall time includes upstream network and local serialization. A single sample per cold path is descriptive. Cache reuse is checked with a repeat for the first profile.

## Synthetic calibration

These inputs exercise the formula and initial saturation thresholds. They do not estimate how easy each path is to complete in production.

| Scenario | V3.1 collaboration | V3.2 review | V3.2 contributor | V3.2 maintainer | V3.2 issue | V3.2 counted total |
|---|---:|---:|---:|---:|---:|---:|
| Contributor only | 7.77 | 0 | 7 | 0 | 0 | 7 |
| Maintainer only | 0 | 0 | 0 | 7 | 0 | 7 |
| Review focused | 4 | 5 | 0 | 0 | 0 | 5 |
| Repeated collaboration with one teammate | 4 | 4.23 | 0 | 5.46 | 0 | 9.69 |
| Organization maintainer | 0 | 0 | 0 | 7 | 0 | 7 |
| Both paths saturated, with reviews and issues | 11.77 | 5 | 7 | 7 | 3 | 15 |
| Solo, self-merged PR | 0 | 0 | 0 | 0 | 0 | 0 |

A maintainer fixture reaches 7 with 50 merges across 20 authors. A contributor fixture reaches 7 with 50 independent merges and 30 independently reviewed PRs. The constraints reflect different opportunities. Equal ceilings do not establish equal real-world difficulty. Small-team collaboration retains substantial volume credit. Stable IDs, human attribution and self-action exclusions make repeated events and automation ineligible for extra points.

## Pure-core timing

`bun scripts/scoring-role-benchmark.ts` compares the same synthetic dual-role snapshot across versions. These release-build results exclude process startup, use pre-encoded bytes for WASM transfer, and discard the first 10 of 120 runs.

| Engine and phase | V3.1 median / p95 ms | V3.2 median / p95 ms |
|---|---:|---:|
| TypeScript, in-memory snapshot to result | 0.587 / 1.140 | 0.553 / 1.552 |
| Native Rust, scoring stage | 0.008 / 0.026 | 0.029 / 0.087 |
| Native Rust, decode through encode | 0.475 / 0.721 | 0.399 / 0.618 |
| WASM, transfer and compute | 0.910 / 2.883 | 0.650 / 1.355 |

Variability in these small measurements and differences in timing boundaries preclude a conclusion about speedups. No production execution path changed.


## Live collection comparison

The completed comparison used the authenticated account and four public comparison profiles. Some highly active profiles hit the existing primary deadline in both versions, so they have no valid score measurements. A failed request counts as an attempt, with billed points unknown if the response was unavailable.

| Profile / mode | Status | GraphQL requests / points | Search requests | REST requests | Candidate rows | Confirmed merges | GraphQL bytes | Endpoint ms | Collaboration / total | Unresolved / saturation-resolved |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| hnamhocit · V3.1 | 200 | 2 / 4 | 0 | 3 | 0 | — | 136648 | 7002 | 4 / 61.78 | 0 / 0 |
| octocat · V3.1 | 200 | 1 / 3 | 0 | 2 | 0 | — | 34334 | 1607 | 0 / 18.58 | 0 / 0 |
| swyx · V3.1 | 200 | 1 / 3 | 0 | 2 | 0 | — | 33297 | 864 | 0 / 3.12 | 0 / 0 |
| mattt · V3.1 | 502 | 1 / — | — | 2 | — | — | 0 | 9010 | — / — | — / — |
| pi0 · V3.1 | 502 | 1 / — | — | 2 | — | — | 0 | 9013 | — / — | — / — |
| hnamhocit · V3.2 | 200 | 3 / 6 | 1 | 3 | 54 | 113 | 173970 | 8453 | 11.6 / 69.38 | 4 / 1 |
| octocat · V3.2 | 200 | 2 / 4 | 1 | 2 | 30 | 0 | 47206 | 3620 | 0 / 18.58 | 5 / 0 |
| swyx · V3.2 | 200 | 2 / 4 | 1 | 2 | 30 | 0 | 44955 | 2415 | 0 / 3.12 | 5 / 0 |
| mattt · V3.2 | 502 | 1 / — | — | 2 | — | — | 0 | 9013 | — / — | — / — |
| pi0 · V3.2 | 502 | 1 / — | — | 2 | — | — | 0 | 9012 | — / — | — / — |
| hnamhocit · V3.2 warm | 200 | 2 / 4 | 0 | 3 | 54 | 113 | 152770 | 6061 | 11.6 / 69.38 | 4 / 1 |

For hnamhocit, the 11.60 collaboration points are 4.87 review, 6.73 shared role from the maintainer path, and 0 observed issue-resolution points. The contributor path contributed 0 observed points. The score interval is 69.38–72.65 and crosses a rank threshold. The two lower-activity successful profiles retained their observed scores and resolved their ranks despite unresolved collaboration bounds. The four public achievement badges for hnamhocit and three for octocat were preserved.

The existing review evidence already established all 113 observed maintainer merges on the hnamhocit sample. Search returned 54 candidate rows, including potential overlaps, and added no confirmed maintainer merges or eligible issue resolution on that sample. The other two successful samples likewise added no qualifying outcomes. The additional search cost was 1–2 points for successful cold samples. Its measured benefit here was discovery coverage, not extra verified outcomes. Keep it bounded for unseen historical integrations and use cached evidence on repeat requests. No individual commit records were fetched for either scoring version.

Two profiles in the final comparison hit the 9-second primary GraphQL deadline in both versions. An earlier run also hit that deadline for sindresorhus, gaearon and yyx990803. These are coverage gaps in the live comparison. The contributor-only, reviewer-heavy, small-team and organization-maintainer paths have controlled coverage in the synthetic fixtures above.

## Verification

The Next.js production build, TypeScript check, changed-file Biome check, 21 Bun tests, Rust tests and Clippy passed. Native and WASM release builds passed and 25 fixtures agreed across TypeScript, Rust and WASM. Production-route smoke tests exercised truncated search, stable-ID deduplication, human merger attribution, warm candidate reuse, cache isolation, rate limiting, rollback, and the public achievement path. Repository-wide lint retains 18 pre-existing errors outside this change.
