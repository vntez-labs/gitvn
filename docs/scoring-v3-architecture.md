# Scoring V3 architecture

The existing Insights route passes GitHub's bounded collection response to a public-evidence adapter. The adapter assigns stable repository and event IDs, UTC timestamps, visibility, repository ownership and evidence completeness. The route sends a typed score breakdown alongside the existing profile and activity payload. The browser renders the breakdown using existing Mantine cards, progress bars and rank assets. The calendar and code-change panels retain their original data sources.

## Pipeline

`RawActivitySnapshot → normalize → adjust → calculate → ScoreResult`

Normalization validates inputs, filters the calendar window and public visibility, and deduplicates observations. Adjustment groups eligible records by UTC day, UTC week, and stable repository and interaction ID. Scoring applies the versioned configuration and emits rank, metric-level explanations, adjustment evidence and completeness. No pipeline phase reads the clock, performs I/O, or depends on framework or GitHub authentication. Evaluation timestamps are Unix milliseconds.

Hash-based indexes and a fixed 365-day scan yield expected O(n + r + 365) time for n records and r repositories and O(n + r + 365) memory. Floating-point commit totals accumulate in chronological order. Rank calculations consume the displayed hundredth-point score. Current and next rank use the indices of the seven existing tiers, with their thresholds carried in the result.

TypeScript and Rust use the same checked-in configuration and metric labels. The native Rust library accepts strongly typed snapshots and returns typed errors. The optional WASM module takes a bounded UTF-8 JSON buffer and writes one result buffer per snapshot. Both buffers are owned by Rust. The module exports no HTTP or authentication capability. A benchmark-only feature imports a monotonic clock. The production Next.js bundle does not require Cargo or WebAssembly.

## Collection and caching

The profile GraphQL operation carries the first page of scoring evidence. A truncated review connection can trigger one extra request. A parallel, optional public commit-history batch can reconcile daily aggregates against default-branch commit identities. The review follow-up has a four-second timeout and the history batch has a 6.5-second timeout. Both fall back to the primary response. The public email lookup stays on REST so the profile GraphQL query works with tokens that lack email scopes. V3 caps reviews at two pages, other connections at one page, and marks any remaining truncation. This caps work on large profiles and avoids per-repository and per-commit request loops. The primary route timeout remains in place. For rate-limit responses the route returns a retry hint and avoids retrying inside the request.

The authenticated transport and HTTP response use `no-store`. A bounded process-local score cache keys results by subject ID, adapter snapshot hash, exact evaluation bucket, version, configuration hash, and hashed credential scope. Only public-evidence scoring results enter that cache. The adapter never receives the credential, and the credential hash is kept server-side. The 30-second evaluation bucket permits reuse when evidence matches and keeps the UTC day boundary aligned. The cache is opportunistic per process and independent of deployment topology.

## Rollback

Set `GITVN_SCORING_V3=0` on the server and redeploy or restart. The route omits extra scoring fields and the dashboard uses the preserved legacy scorer. V3 changes neither persisted profile data nor the legacy return shape. A deployment can use the TypeScript path without copying Rust/WASM artifacts.

## API references

[GitHub contribution collection](https://docs.github.com/en/graphql/reference/users) · [GitHub pull requests and reviews](https://docs.github.com/en/graphql/reference/pulls) · [GitHub issue timelines](https://docs.github.com/en/graphql/reference/issues)

The commit-history batch prioritizes public, non-fork repositories that can cross the project threshold. It may read one extra page for up to five still-unresolved repositories, pinned to their original branch tips and within the same 6.5-second deadline. A 32-entry process cache reuses matching history for five minutes and allows a bounded 30-minute fallback on upstream failure. The key includes hashed credential scope, subject, UTC window start, selected repositories, and observed daily commit totals. A changed aggregate requires fresh evidence.
