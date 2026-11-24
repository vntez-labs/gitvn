import "server-only";

import { createHash } from "node:crypto";
import { adjust } from "./adjust";
import type { Config, RawActivitySnapshot, ScoreResult } from "./models";
import { DAY, normalize } from "./normalize";
import { calculate, defaultConfig, validateConfig } from "./score";

const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const cache = new Map<string, ScoreResult>();
const MAX_ENTRIES = 64;

export function scoreProfile(
  snapshot: RawActivitySnapshot,
  visibilityScope: string,
  config: Config = defaultConfig,
  timing?: { normalizationMs: number; scoringMs: number },
) {
  const key = [
    hash(visibilityScope),
    snapshot.subject,
    Math.floor(snapshot.evaluatedAt / DAY),
    snapshot.evaluatedAt,
    config.version,
    hash(JSON.stringify(config)),
    hash(JSON.stringify(snapshot)),
  ].join(":");
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }
  const start = performance.now();
  validateConfig(config);
  const normalized = normalize(snapshot);
  const normalizedAt = performance.now();
  const result = calculate(normalized, adjust(normalized, config), config);
  if (timing) {
    timing.normalizationMs = normalizedAt - start;
    timing.scoringMs = performance.now() - normalizedAt;
  }
  cache.set(key, result);
  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return result;
}
