import assert from "node:assert/strict";
import { test } from "node:test";
import { getActivityRank } from "../../src/lib/activity-rank";

test("legacy rank baselines remain callable", () => {
  assert.equal(
    getActivityRank({ weeks: [], contributions: 0, repositories: 0 }).score,
    0,
  );
  const result = getActivityRank({
    weeks: [],
    contributions: 2000,
    repositories: 20,
    stars: 50,
    followers: 20,
    releases: 5,
    pulls: 60,
    longestStreak: 30,
  });
  assert.equal(result.score, 85);
  assert.equal(result.rank.badge, "chua-te");
});
