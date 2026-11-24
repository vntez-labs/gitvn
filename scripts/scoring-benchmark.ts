import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { cpus, platform, release } from "node:os";
import {
  evaluatedAt,
  event,
  scenarios,
  snapshot,
} from "../fixtures/scoring/scenarios";
import { createWasmScorer, requestBytes } from "../packages/gitvn-core-wasm";
import { getActivityRank } from "../src/lib/activity-rank";
import { summarizeActivity } from "../src/lib/profile-activity";
import { adjust } from "../src/lib/scoring/adjust";
import type { RawActivitySnapshot } from "../src/lib/scoring/models";
import { DAY, normalize, utcDay } from "../src/lib/scoring/normalize";
import {
  calculate,
  defaultConfig,
  scoreActivity,
  validateConfig,
} from "../src/lib/scoring/score";

type Timings = {
  decode: number;
  normalization: number;
  anti_abuse?: number;
  scoring: number;
  encode: number;
  end_to_end: number;
  boundary?: number;
};

const target = "crates/gitvn-core/target";
const wasmPath = `${target}/wasm32-unknown-unknown/release/gitvn_core.wasm`;
const native = `${target}/release/score`;
const clock = { benchmark: { now: () => performance.now() } };
const iterations = Number(process.env.GITVN_BENCH_RUNS ?? 9);
if (!Number.isSafeInteger(iterations) || iterations < 3)
  throw new Error("Use at least three iterations.");

function runTypeScript(json: string, legacy: boolean): Timings {
  const start = performance.now();
  const { snapshot: input }: { snapshot: RawActivitySnapshot } =
    JSON.parse(json);
  const decoded = performance.now();
  if (legacy) {
    const size = input.events.length;
    const dateCounts = Array<number>(365).fill(0);
    const totals = { commits: 0, pulls: 0, issues: 0, reviews: 0 };
    for (const event of input.events) {
      totals[event.kind]++;
      dateCounts[Math.floor((evaluatedAt - event.at) / DAY)]++;
    }
    const weeks = Array.from({ length: 53 }, (_, week) => ({
      contributionDays: dateCounts
        .slice(week * 7, (week + 1) * 7)
        .map((contributionCount, day) => ({
          date: new Date(evaluatedAt - (week * 7 + day) * DAY)
            .toISOString()
            .slice(0, 10),
          contributionCount,
          weekday: day,
          contributionLevel: "",
        })),
    }));
    const through = new Date(evaluatedAt).toISOString().slice(0, 10);
    const summary = summarizeActivity(weeks, through);
    const normalized = performance.now();
    const result = getActivityRank({
      weeks,
      contributions: size,
      repositories: input.repositories.length,
      longestStreak: summary.longestStreak,
      ...totals,
    });
    const scored = performance.now();
    JSON.stringify(result);
    const encoded = performance.now();
    return {
      decode: decoded - start,
      normalization: normalized - decoded,
      scoring: scored - normalized,
      encode: encoded - scored,
      end_to_end: encoded - start,
    };
  }
  validateConfig(defaultConfig);
  const normalized = normalize(input);
  const normal = performance.now();
  const adjusted = adjust(normalized, defaultConfig);
  const adjustment = performance.now();
  const result = calculate(normalized, adjusted, defaultConfig);
  const scored = performance.now();
  JSON.stringify(result);
  const encoded = performance.now();
  return {
    decode: decoded - start,
    normalization: normal - decoded,
    anti_abuse: adjustment - normal,
    scoring: scored - adjustment,
    encode: encoded - scored,
    end_to_end: encoded - start,
  };
}

function summarize(runs: Timings[], size: number) {
  const metrics = Object.fromEntries(
    Object.keys(runs[0]).map((key) => {
      const values = runs
        .map((run) => run[key as keyof Timings] ?? 0)
        .sort((a, b) => a - b);
      const half = Math.floor(values.length / 2);
      return [
        key,
        {
          median:
            values.length % 2
              ? values[half]
              : (values[half - 1] + values[half]) / 2,
          p95: values[Math.ceil(values.length * 0.95) - 1],
        },
      ];
    }),
  );
  return {
    cold: runs[0].end_to_end,
    eventsPerSecond: Math.round((size * 1000) / metrics.end_to_end.median),
    metrics,
  };
}

function makeInput(size: number) {
  return snapshot({
    events: Array.from({ length: size }, (_, i) => {
      const kind =
        i % 20 < 17
          ? "commits"
          : i % 20 === 17
            ? "pulls"
            : i % 20 === 18
              ? "issues"
              : "reviews";
      return event(
        kind,
        i,
        i % 365,
        kind === "reviews" ? { pr: `pr-${i}`, prAuthor: "another" } : {},
      );
    }),
  });
}

// This path mirrors the server after GraphQL has already decoded the response.
async function benchmarkProfileObject() {
  const template = scenarios.individual;
  const input = {
    ...template,
    events: template.events.filter((event) => event.kind !== "commits"),
    dailyCommits: Array.from({ length: 300 }, (_, i) => ({
      day: utcDay(evaluatedAt) - (i % 120),
      repo: template.repositories[i % 4].id,
      count: 3,
    })),
    coverage: { ...template.coverage, commits: "partial" as const },
  };
  // Use one observation per repository/date pair.
  input.dailyCommits = Array.from(
    new Map(
      input.dailyCommits.map((row) => [`${row.repo}:${row.day}`, row]),
    ).values(),
  );
  const size = input.events.length + input.dailyCommits.length;
  const initStart = performance.now();
  const wasm = await createWasmScorer(
    await WebAssembly.compile(readFileSync(wasmPath)),
    clock,
  );
  const wasmInitialize = performance.now() - initStart;
  const measure = (run: () => unknown) => {
    const start = performance.now();
    run();
    return { end_to_end: performance.now() - start };
  };
  const format = (runs: { end_to_end: number }[]) => ({
    cold: runs[0].end_to_end,
    ...summarizeLatencies(runs.slice(1)),
  });
  const ts = [];
  const wasmRuns = [];
  for (let i = 0; i < 101; i++) {
    ts.push(measure(() => scoreActivity(input)));
    wasmRuns.push(measure(() => wasm.score(input)));
  }
  wasm.release();
  return {
    size,
    wasmInitialize,
    warmIterations: 100,
    typescript: format(ts),
    wasm: format(wasmRuns),
  };
}

function summarizeLatencies(runs: { end_to_end: number }[]) {
  const sorted = runs.map((run) => run.end_to_end).sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);
  return {
    median: (sorted[half - 1] + sorted[half]) / 2,
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
  };
}

const stdout: unknown[] = [];
const sizes = process.argv.includes("--profile-only")
  ? []
  : [1000, 10_000, 100_000, 1_000_000];
for (const size of sizes) {
  const input = makeInput(size);
  const bytes = requestBytes(input);
  const json = new TextDecoder().decode(bytes);
  const coldStart = performance.now();
  const wasm = await createWasmScorer(
    await WebAssembly.compile(readFileSync(wasmPath)),
    clock,
  );
  const wasmInitialize = performance.now() - coldStart;
  const nativeStart = performance.now();
  const gnuTime = existsSync("/usr/bin/time");
  const count = String(iterations + 1);
  const processResult = spawnSync(
    gnuTime ? "/usr/bin/time" : native,
    gnuTime ? ["-f", "%M", native, count] : [count],
    { input: bytes },
  );
  if (processResult.status !== 0)
    throw new Error(processResult.stderr.toString());
  const nativeRuns: Timings[] = JSON.parse(processResult.stdout.toString());
  const nativePeakRssKiB = gnuTime
    ? Number(processResult.stderr.toString().trim())
    : null;
  const nativeProcessWall = performance.now() - nativeStart;
  const legacyRuns: Timings[] = [];
  const tsRuns: Timings[] = [];
  const wasmRuns: Timings[] = [];
  for (let index = 0; index <= iterations; index++) {
    legacyRuns.push(runTypeScript(json, true));
    tsRuns.push(runTypeScript(json, false));
    const wasmStart = performance.now();
    const { boundary } = wasm.transfer(bytes);
    const end_to_end = performance.now() - wasmStart;
    const { result } = wasm.transfer(bytes, true);
    wasmRuns.push({ ...result, end_to_end, boundary });
  }
  const results = {
    size,
    inputBytes: bytes.length,
    wasmInitialize,
    nativeProcessWall,
    nativePeakRssKiB,
    wasmMemoryBytes: wasm.memoryBytes(),
    processPeakRssKiB: process.resourceUsage().maxRSS,
    implementations: Object.fromEntries(
      Object.entries({
        legacy: legacyRuns,
        typescript: tsRuns,
        native: nativeRuns,
        wasm: wasmRuns,
      }).map(([name, runs]) => [
        name,
        { ...summarize(runs.slice(1), size), cold: runs[0].end_to_end },
      ]),
    ),
  };
  stdout.push(results);
  wasm.release();
  console.error(`Measured ${size} events`);
}
console.log(
  JSON.stringify(
    {
      hardware: cpus()[0]?.model,
      os: `${platform()} ${release()}`,
      runtime: process.versions.bun ?? process.version,
      warmIterations: iterations,
      results: stdout,
      profileObject: await benchmarkProfileObject(),
    },
    null,
    2,
  ),
);
