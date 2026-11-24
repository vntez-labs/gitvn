import { scenarios } from "../fixtures/scoring/scenarios";
import { activityRanks } from "../src/lib/activity-rank";
import type { Config } from "../src/lib/scoring/models";
import { defaultConfig, scoreActivity } from "../src/lib/scoring/score";

function thresholds(factor: number) {
  const config = structuredClone(defaultConfig);
  for (const category of Object.values(config.categories)) {
    for (const key of Object.keys(category) as (keyof typeof category)[]) {
      const entry = category[
        key
      ] as Config["categories"]["activity"]["commits"];
      Object.assign(category, {
        [key]: [entry[0], entry[1] * factor, entry[2]],
      });
    }
  }
  return config;
}

const easier = thresholds(0.75);
const harder = thresholds(1.25);
const ranks = Object.fromEntries(activityRanks.map((rank) => [rank.name, 0]));
const saturation: Record<string, number> = {};
const rows = Object.entries(scenarios).map(([name, snapshot]) => {
  const result = scoreActivity(snapshot);
  const rank = activityRanks[result.rank].name;
  ranks[rank]++;
  for (const category of result.categories) {
    saturation[category.id] ??= 0;
    if (category.points === category.maximum) saturation[category.id]++;
  }
  return {
    name,
    score: result.totalScore,
    rank,
    easier: scoreActivity(snapshot, easier).totalScore,
    harder: scoreActivity(snapshot, harder).totalScore,
    provisional: result.provisional,
    categories: Object.fromEntries(
      result.categories.map((category) => [category.id, category.points]),
    ),
  };
});
const scores = rows.map((row) => row.score).sort((a, b) => a - b);
const middle = Math.floor(scores.length / 2);
const median =
  scores.length % 2
    ? scores[middle]
    : (scores[middle - 1] + scores[middle]) / 2;
const obscured = {
  ...scenarios.focusedMaintainer,
  events: [],
  coverage: { followers: "complete" as const },
  limitations: ["Synthetic missing activity evidence."],
};
console.log(
  JSON.stringify(
    {
      population:
        "synthetic scenarios including adversarial and maximum-score controls",
      scores: { min: scores[0], median, max: scores.at(-1) },
      ranks,
      saturation,
      missingDataControl: {
        visible: scoreActivity(scenarios.focusedMaintainer).totalScore,
        missing: scoreActivity(obscured).totalScore,
        provisional: scoreActivity(obscured).provisional,
      },
      rows,
    },
    null,
    2,
  ),
);
