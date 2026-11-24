import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout } from "node:timers/promises";

if (process.env.GITVN_BENCH_OBSERVE === "1") {
  const upstream = globalThis.fetch;
  const fixed = Number(process.env.GITVN_BENCH_EVALUATED_AT);
  if (Number.isFinite(fixed)) Date.now = () => fixed;
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.hostname !== "api.github.com") return upstream(input, init);
    const graphql = url.pathname === "/graphql";
    const started = performance.now();
    process.stdout.write(
      `${JSON.stringify({ sample: graphql ? "graphql-start" : "rest" })}\n`,
    );
    if (graphql) {
      const body = JSON.parse(init.body);
      if (!body.query.includes("rateLimit {")) {
        body.query = body.query.replace(
          "{",
          "{ rateLimit { cost remaining resetAt }",
        );
        init = { ...init, body: JSON.stringify(body) };
      }
    }
    const response = await upstream(input, init);
    if (graphql) {
      const payload = await response.clone().text();
      let graph;
      try {
        graph = JSON.parse(payload);
      } catch {
        graph = {};
      }
      let history = 0;
      let buckets = 0;
      function countRecords(value) {
        if (!value || typeof value !== "object") return;
        if (Array.isArray(value)) {
          for (const entry of value) countRecords(entry);
          return;
        }
        if (
          typeof value.oid === "string" &&
          typeof value.authoredDate === "string"
        )
          history++;
        if (
          typeof value.commitCount === "number" &&
          typeof value.occurredAt === "string"
        )
          buckets++;
        for (const child of Object.values(value)) countRecords(child);
      }
      countRecords(graph.data);
      process.stdout.write(
        `${JSON.stringify({
          sample: "graphql",
          points: graph.data?.rateLimit?.cost ?? null,
          ms: Math.round(performance.now() - started),
          bytes: Buffer.byteLength(payload),
          history,
          buckets,
        })}\n`,
      );
    }
    return response;
  };
} else {
  const gh = (args) => execFileSync("gh", args, { encoding: "utf8" }).trim();
  const ownLogin = gh(["api", "user", "--jq", ".login"]);
  const token = gh(["auth", "token"]);
  const profiles = process.argv.slice(2);
  const compareRoles = process.env.GITVN_BENCH_ROLES === "1";
  if (!profiles.length)
    profiles.push(
      ownLogin,
      "octocat",
      ...(compareRoles ? ["sindresorhus", "gaearon", "yyx990803"] : []),
    );
  const samples = [];
  const evaluation = String(Math.floor(Date.now() / 30_000) * 30_000);
  for (const mode of compareRoles
    ? ["v31", "v32"]
    : ["rollback", "aggregate", "adaptive"]) {
    const probe = createServer().listen(0, "127.0.0.1");
    await once(probe, "listening");
    const { port } = probe.address();
    await new Promise((resolve) => probe.close(resolve));
    const child = spawn(
      process.execPath,
      [
        "--import",
        import.meta.url,
        "node_modules/next/dist/bin/next",
        "start",
        "-H",
        "127.0.0.1",
        "-p",
        String(port),
      ],
      {
        env: {
          ...process.env,
          GITVN_BENCH_OBSERVE: "1",
          GITVN_BENCH_EVALUATED_AT: evaluation,
          GITVN_COLLECTION_DIAGNOSTICS: "1",
          GITVN_SCORING_V3: "1",
          GITVN_SCORING_ROLE: mode === "v32" ? "1" : "0",
          GITVN_COLLECTOR_VERSION: mode === "rollback" ? "3.0" : "3.1",
          GITVN_COLLECTION_ADAPTIVE: mode === "aggregate" ? "0" : "1",
        },
        stdio: ["ignore", "pipe", "inherit"],
      },
    );
    const exited = once(child, "exit");
    let lines = "";
    child.stdout.setEncoding("utf8").on("data", (text) => {
      lines += text;
    });
    const base = `http://127.0.0.1:${port}/api/github/user/`;
    try {
      for (let i = 0; i < 80; i++) {
        const ready = await fetch(`${base}test`).catch(() => undefined);
        if (ready) break;
        await setTimeout(100);
      }
      for (const login of mode === "adaptive" || mode === "v32"
        ? [...profiles, profiles[0]]
        : profiles) {
        const offset = lines.length;
        const start = performance.now();
        const response = await fetch(base + encodeURIComponent(login), {
          headers: { Cookie: `github_access_token=${token}` },
          redirect: "error",
          signal: AbortSignal.timeout(25_000),
        });
        const result = await response.json();
        const endToEndMs = Math.round(performance.now() - start);
        await setTimeout(50);
        const records = lines
          .slice(offset)
          .split("\n")
          .filter((line) => line.startsWith("{"))
          .map((line) => JSON.parse(line));
        const attempts = records.filter(
          (record) => record.sample === "graphql-start",
        ).length;
        const gql = records.filter((record) => record.sample === "graphql");
        const metric = (id) =>
          result.score?.categories
            .flatMap((category) => category.metrics)
            .find((value) => value.id === id)?.raw;
        const weeks = result.activity?.weeks ?? [];
        samples.push({
          mode,
          login,
          status: response.status,
          endToEndMs,
          graphqlRequests: attempts,
          points:
            attempts === gql.length &&
            gql.every((record) => record.points !== null)
              ? gql.reduce((sum, record) => sum + record.points, 0)
              : null,
          individualCommitRecords: gql.reduce(
            (sum, record) => sum + record.history,
            0,
          ),
          aggregateBuckets: gql.reduce(
            (sum, record) => sum + record.buckets,
            0,
          ),
          graphqlBytes: gql.reduce((sum, record) => sum + record.bytes, 0),
          graphqlMs: gql.map((record) => record.ms),
          restRequests: records.filter((record) => record.sample === "rest")
            .length,
          weeks: metric("activeWeeks"),
          providerWeekColumns: weeks.filter((week) =>
            week.contributionDays.some((day) => day.contributionCount > 0),
          ).length,
          score: result.score?.totalScore,
          collaboration: result.score?.categories.find(
            (category) => category.id === "collaboration",
          )?.points,
          role: result.score?.collaboration
            ? {
                review: result.score.collaboration.review.points,
                contributor: result.score.collaboration.contributor.points,
                maintainer: result.score.collaboration.maintainer.points,
                issues: result.score.collaboration.issues.points,
                maximum: result.score.collaboration.maximum,
                maintainerMerges:
                  result.score.collaboration.maintainer.metrics[0].raw,
              }
            : undefined,
          bounds: result.score?.bounds,
          badges: result.achievements?.length,
          missing: result.score?.completeness.missingMetrics,
          diagnostics: records.find(
            (record) => record.event === "gitvn-collection",
          ),
        });
      }
    } finally {
      child.kill();
      await exited;
    }
  }
  console.log(JSON.stringify(samples, null, 2));
}
