# Scoring V3 verification, benchmarks and calibration

## Reproduce

```sh
bun test fixtures/scoring
bun x tsc --noEmit
bun run build
node fixtures/scoring/insights-smoke.mjs
cargo test --manifest-path crates/gitvn-core/Cargo.toml
rustup target add wasm32-unknown-unknown
cargo build --release --features benchmark --manifest-path crates/gitvn-core/Cargo.toml
cargo build --release --target wasm32-unknown-unknown --lib --manifest-path crates/gitvn-core/Cargo.toml
bun fixtures/scoring/parity.ts
cargo build --release --features benchmark --target wasm32-unknown-unknown --lib --manifest-path crates/gitvn-core/Cargo.toml
bun scripts/scoring-benchmark.ts
bun scripts/scoring-calibrate.ts
```

The production smoke test starts Next.js on loopback with a synthetic GitHub provider. It checks the authenticated payload, rate-limit handling, cache headers, and the rollback flag.

Parity compares the full result on 17 fixtures with absolute numeric tolerance of 1e-9. Rank indexes, version, evidence flags and explanation strings compare exactly.

## Method

Measured on an Intel Core i5-1035G1 with Fedora Linux x86-64 (kernel 7.2.14), Bun 1.4.3 and Rust 1.98.1. The deterministic data contains one repository and 85% commits, 5% PRs, 5% issues and 5% reviews, spread across 365 dates. Each implementation receives identical observations as JSON, with approximately 0.09, 0.93, 9.44 and 95.48 MB of input. The legacy adapter projects the events to the legacy calendar and counts before calling the original formula. It performs simpler work and has no anti-abuse stage. The original dashboard normally receives aggregate data directly, so legacy projection and decoding times are benchmark costs and are separate from its original dashboard runtime.

Each workload has a first run and nine warm iterations. p95 uses nearest rank and equals the maximum at this sample size. Measurement excludes input creation, network, and API collection costs. TS timings start with a JS JSON string. Rust and WASM start with UTF-8 bytes. Native timings exclude process setup and stdin loading. WASM end-to-end includes copying input to linear memory and decoding the output back to a JS object. Its stage timings come from a separate profiled call on the same instance. The harness runs all JS paths in one process, so its RSS is cumulative and cannot isolate TS from WASM. Stage medians need not sum to the median total.

## End-to-end measurements

Each latency cell is median / p95 in milliseconds, except the first-run column.

| Events | Engine | Warm ms | First run ms | Warm events/s |
|---:|---|---:|---:|---:|
| 1,000 | Legacy TS | 1.073 / 3.606 | 4.741 | 931,981 |
| 1,000 | V3 TS | 2.385 / 3.280 | 10.123 | 419,374 |
| 1,000 | Native Rust | 1.301 / 2.211 | 1.184 | 768,895 |
| 1,000 | WASM | 2.125 / 4.789 | 10.664 | 470,651 |
| 10,000 | Legacy TS | 4.249 / 7.587 | 3.781 | 2,353,522 |
| 10,000 | V3 TS | 10.178 / 19.572 | 14.709 | 982,558 |
| 10,000 | Native Rust | 11.396 / 15.763 | 14.596 | 877,485 |
| 10,000 | WASM | 16.289 / 23.661 | 46.481 | 613,900 |
| 100,000 | Legacy TS | 51.029 / 62.249 | 60.666 | 1,959,679 |
| 100,000 | V3 TS | 114.637 / 129.515 | 132.278 | 872,322 |
| 100,000 | Native Rust | 150.751 / 155.560 | 171.436 | 663,344 |
| 100,000 | WASM | 164.043 / 187.490 | 228.197 | 609,597 |
| 1,000,000 | Legacy TS | 523.662 / 706.404 | 714.431 | 1,909,628 |
| 1,000,000 | V3 TS | 1428.072 / 1709.026 | 1465.273 | 700,245 |
| 1,000,000 | Native Rust | 2154.188 / 2175.927 | 2172.718 | 464,212 |
| 1,000,000 | WASM | 2074.690 / 2577.125 | 2256.518 | 482,000 |

## Stage measurements

Each cell is median / p95 in milliseconds.

| Events | Engine | Decode | Normalize | Adjust | Score | Encode | WASM boundary |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1,000 | Legacy TS | 0.493 / 0.670 | 0.514 / 2.217 | — | 0.058 / 0.972 | 0.021 / 0.096 | — |
| 1,000 | V3 TS | 0.442 / 0.589 | 1.112 / 1.868 | 0.675 / 0.937 | 0.125 / 0.204 | 0.034 / 0.162 | — |
| 1,000 | Native Rust | 0.471 / 0.845 | 0.264 / 0.352 | 0.375 / 0.840 | 0.008 / 0.042 | 0.021 / 0.048 | — |
| 1,000 | WASM | 0.640 / 1.795 | 0.334 / 0.606 | 0.640 / 1.136 | 0.017 / 0.064 | 0.094 / 0.127 | 0.158 / 0.463 |
| 10,000 | Legacy TS | 2.786 / 6.194 | 0.792 / 2.342 | — | 0.044 / 0.166 | 0.014 / 0.042 | — |
| 10,000 | V3 TS | 3.687 / 6.686 | 3.120 / 9.190 | 1.701 / 3.233 | 0.087 / 0.384 | 0.035 / 0.119 | — |
| 10,000 | Native Rust | 3.898 / 6.603 | 1.911 / 2.708 | 4.692 / 6.856 | 0.008 / 0.012 | 0.015 / 0.024 | — |
| 10,000 | WASM | 5.240 / 6.455 | 1.849 / 3.697 | 5.143 / 9.334 | 0.017 / 0.036 | 0.058 / 0.120 | 0.527 / 0.898 |
| 100,000 | Legacy TS | 49.338 / 59.182 | 2.279 / 2.837 | — | 0.058 / 0.150 | 0.023 / 0.080 | — |
| 100,000 | V3 TS | 41.851 / 51.728 | 59.173 / 79.000 | 11.644 / 13.603 | 0.098 / 0.253 | 0.075 / 0.166 | — |
| 100,000 | Native Rust | 40.255 / 46.946 | 21.799 / 29.801 | 69.230 / 74.917 | 0.009 / 0.040 | 0.016 / 0.030 | — |
| 100,000 | WASM | 50.434 / 57.547 | 21.249 / 28.044 | 69.609 / 73.368 | 0.016 / 0.091 | 0.043 / 0.250 | 3.394 / 5.222 |
| 1,000,000 | Legacy TS | 506.829 / 685.055 | 18.177 / 41.650 | — | 0.037 / 0.277 | 0.011 / 0.020 | — |
| 1,000,000 | V3 TS | 510.758 / 699.129 | 797.817 / 877.748 | 128.196 / 179.797 | 0.090 / 0.180 | 0.033 / 0.751 | — |
| 1,000,000 | Native Rust | 506.550 / 538.438 | 534.776 / 559.038 | 777.093 / 832.363 | 0.011 / 0.041 | 0.019 / 0.050 | — |
| 1,000,000 | WASM | 494.582 / 520.249 | 510.769 / 566.558 | 819.858 / 850.269 | 0.012 / 0.040 | 0.036 / 0.364 | 27.850 / 37.166 |

## Startup and memory

WASM startup measures module read, compilation and instantiation before the first solve. The JS paths share one Bun process with imports loaded before timing. The native process is fresh for each size and reports its first in-process solve separately from process setup. WASM linear memory is allocated capacity after all runs. Native peak RSS is measured by GNU time.

| Events | WASM startup ms | WASM memory MiB | Native peak RSS MiB | Combined harness peak RSS MiB |
|---:|---:|---:|---:|---:|
| 1,000 | 4.997 | 1.44 | 3.43 | 68.08 |
| 10,000 | 3.055 | 5.44 | 8.18 | 108.41 |
| 100,000 | 4.321 | 36.50 | 49.74 | 379.77 |
| 1,000,000 | 11.527 | 363.88 | 538.03 | 2953.20 |

At 1,000 events WASM was marginally faster at the median and slower at p95, with extra startup. TypeScript led WASM at the median for the other three sizes. The route already holds decoded JS objects. A separate 168-observation test (120 daily commit aggregates and 48 detailed events) starts from that decoded shape and includes input encoding on the WASM path. Over 100 warm runs TypeScript measured **0.381 / 0.995 ms** median / p95 and WASM measured **0.637 / 1.313 ms** with **5.356 ms** module startup. The first solve after setup took 7.264 ms in TypeScript and 8.571 ms in WASM. Reproduce this smaller test with `bun scripts/scoring-benchmark.ts --profile-only`. Keep TypeScript as the production default.

## Calibration

Authorized live GitHub GraphQL access was unavailable. The reproducible calibration uses 14 synthetic archetypes and controls. Threshold sensitivity multiplies all saturation thresholds by 0.75 or 1.25 without changing weights or ranks.

| Synthetic profile | Baseline | Thresholds ×0.75 | Thresholds ×1.25 |
|---|---:|---:|---:|
| empty | 0.00 | 0.00 | 0.00 |
| newDeveloper | 2.29 | 2.52 | 2.12 |
| student | 37.63 | 42.76 | 34.41 |
| individual | 54.90 | 61.45 | 50.44 |
| corporate | 26.12 | 28.88 | 24.35 |
| focusedMaintainer | 67.09 | 71.66 | 62.84 |
| manyProjects | 60.60 | 65.65 | 56.99 |
| openSourceMaintainer | 97.21 | 99.62 | 93.76 |
| burst | 7.32 | 7.73 | 7.04 |
| spread | 20.34 | 22.60 | 18.93 |
| emptyFarms | 0.00 | 0.00 | 0.00 |
| maxScore | 100.00 | 100.00 | 97.35 |
| partialAggregate | 5.77 | 6.08 | 5.55 |
| restricted | 0.00 | 0.00 | 0.00 |

The synthetic scores span 0–100 with a median of 23.23. Rank counts are 6, 2, 1, 3, 0, 0 and 2 in ascending tier order. Full category saturation counts are 1 impact, 1 activity, 1 consistency, 3 project coverage and 2 collaboration. These counts include a deliberately saturated control.

Five hundred same-day commits yield 67 effective commits and 7.32 points overall. The same count across 50 dates yields 500 effective commits and 20.34 points. One hundred empty repositories earn zero points. A single focused repository scores 67.09 in the detailed-evidence calibration, while the limited-visibility version of that scenario drops to 0 and becomes provisional. The synthetic control cases isolate formula behavior. They do not estimate how common legitimate bursts are or how many real direct-push maintainers will lose coverage credit under the GitHub aggregate adapter.

The weights were left at their initial experimental values. Production calibration needs a diverse authorized sample before interpreting these scores as population benchmarks.
