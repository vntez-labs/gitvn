import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createWasmScorer, requestBytes } from "../../packages/gitvn-core-wasm";
import {
  aggregateConfig,
  defaultConfig,
  roleConfig,
  scoreActivity,
} from "../../src/lib/scoring/score";
import { roleScenarios } from "./role-scenarios";
import { evaluatedAt, event, repo, scenarios, snapshot } from "./scenarios";

const target = "crates/gitvn-core/target";
const module = await WebAssembly.compile(
  readFileSync(`${target}/wasm32-unknown-unknown/release/gitvn_core.wasm`),
);
const wasm = await createWasmScorer(module, {
  benchmark: { now: () => performance.now() },
});
const native = `${target}/release/score`;
const tolerance = 1e-9;

function compare(actual: unknown, expected: unknown, path = "result"): void {
  if (typeof expected === "number") {
    assert.equal(typeof actual, "number", path);
    assert.ok(
      Math.abs((actual as number) - expected) <= tolerance,
      `${path}: ${actual} vs ${expected}`,
    );
    return;
  }
  if (expected && typeof expected === "object") {
    assert.ok(actual && typeof actual === "object", path);
    const a = actual as Record<string, unknown>;
    const e = expected as Record<string, unknown>;
    assert.deepEqual(Object.keys(a).sort(), Object.keys(e).sort(), path);
    for (const [key, value] of Object.entries(e))
      compare(a[key], value, `${path}.${key}`);
    return;
  }
  assert.equal(actual, expected, path);
}

const adjustments = snapshot({
  repositories: [repo, { ...repo, id: "fork", fork: true }],
  events: [
    event("commits", 1),
    event("commits", 1),
    event("commits", 2, 0, { empty: true }),
    event("commits", 3, 0, { bot: true }),
    event("commits", 4, 0, { at: evaluatedAt + 1 }),
    event("reviews", 1, 0, { pr: "same", prAuthor: "other" }),
    event("reviews", 2, 0, { pr: "same", prAuthor: "other" }),
    event("reviews", 3, 0, { pr: "self", prAuthor: "subject" }),
    event("pulls", 4, 0, { repo: "fork", state: "MERGED", merger: "subject" }),
  ],
});
const projectEvidence = {
  ...scenarios.partialAggregate,
  events: [
    event("commits", 1, 0, { projectEvidenceOnly: true }),
    event("commits", 2, 0, { projectEvidenceOnly: true, empty: true }),
  ],
};
const alternate = structuredClone(defaultConfig);
alternate.categories.activity.commits = [12, 300, "piecewise"];
alternate.rankThresholds = [0, 10, 20, 30, 40, 50, 60];

for (const [name, input] of Object.entries({
  ...scenarios,
  ...roleScenarios,
  adjustments,
  projectEvidence,
  alternate: scenarios.student,
  aggregate: {
    ...scenarios.partialAggregate,
    calendarDays: [Math.floor(evaluatedAt / 86_400_000)],
  },
})) {
  const config = Object.hasOwn(roleScenarios, name)
    ? roleConfig
    : name === "alternate"
      ? alternate
      : name === "aggregate"
        ? aggregateConfig
        : undefined;
  const bytes = requestBytes(input, config);
  const result = scoreActivity(input, config);
  const process = spawnSync(native, { input: bytes });
  assert.equal(process.status, 0, process.stderr.toString());
  compare(JSON.parse(process.stdout.toString()), result, `native.${name}`);
  compare(wasm.score(input, config), result, `wasm.${name}`);
}

assert.throws(
  () => wasm.score(snapshot({ evaluatedAt: Number.NaN })),
  /decode/,
);
const rejected = spawnSync(native, {
  input: requestBytes(snapshot({ evaluatedAt: Number.NaN })),
});
assert.notEqual(rejected.status, 0);
wasm.release();
console.log(
  "25 fixtures match across TypeScript, native Rust and WASM (absolute tolerance 1e-9).",
);
