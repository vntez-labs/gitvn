import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { roleScenarios } from "../fixtures/scoring/role-scenarios";
import { createWasmScorer, requestBytes } from "../packages/gitvn-core-wasm";
import {
  aggregateConfig,
  roleConfig,
  scoreActivity,
} from "../src/lib/scoring/score";

const root = "crates/gitvn-core/target";
const module = await WebAssembly.compile(
  readFileSync(`${root}/wasm32-unknown-unknown/release/gitvn_core.wasm`),
);
const wasm = await createWasmScorer(module);
const repeats = 120;
const stats = (values: number[]) => {
  const sorted = values.slice(10).sort((a, b) => a - b);
  return {
    medianMs: sorted[Math.floor(sorted.length / 2)],
    p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1],
  };
};
function clock(run: () => void) {
  return Array.from({ length: repeats }, () => {
    const start = performance.now();
    run();
    return performance.now() - start;
  });
}
for (const config of [aggregateConfig, roleConfig]) {
  const input = roleScenarios.bothRoles;
  const bytes = requestBytes(input, config);
  const native: { scoring: number; end_to_end: number }[] = JSON.parse(
    execFileSync(`${root}/release/score`, [String(repeats)], {
      input: bytes,
    }).toString(),
  );
  console.log(
    JSON.stringify({
      version: config.version,
      iterations: repeats - 10,
      typescript: stats(
        clock(() => {
          scoreActivity(input, config);
        }),
      ),
      rustScoring: stats(native.map((entry) => entry.scoring)),
      rustEndToEnd: stats(native.map((entry) => entry.end_to_end)),
      wasmTransfer: stats(
        clock(() => {
          wasm.transfer(bytes);
        }),
      ),
      calibration: Object.fromEntries(
        Object.entries(roleScenarios).map(([name, snapshot]) => {
          const score = scoreActivity(snapshot, config);
          return [
            name,
            score.collaboration
              ? {
                  points: score.collaboration.points,
                  review: score.collaboration.review.points,
                  contributor: score.collaboration.contributor.points,
                  maintainer: score.collaboration.maintainer.points,
                  issueResolution: score.collaboration.issues.points,
                  upper: score.collaboration.maximum,
                }
              : { points: score.categories[4].points },
          ];
        }),
      ),
    }),
  );
}
wasm.release();
