// A bottle's remaining level, 0 (empty) .. 5 (full).
export const LEVELS = [
  { value: 5, label: "Full", short: "Full", fraction: "1", pct: 100 },
  { value: 4, label: "Three-quarters", short: "¾", fraction: "¾", pct: 75 },
  { value: 3, label: "Half", short: "½", fraction: "½", pct: 50 },
  { value: 2, label: "Quarter", short: "¼", fraction: "¼", pct: 25 },
  { value: 1, label: "Nearly empty", short: "Low", fraction: "…", pct: 10 },
  { value: 0, label: "Empty", short: "Empty", fraction: "—", pct: 0 },
] as const;

// Bottles at or below this level appear on the restock list.
export const RESTOCK_THRESHOLD = 1;

export function levelMeta(value: number) {
  return LEVELS.find((l) => l.value === value) ?? LEVELS[0];
}

export function needsRestock(level: number) {
  return level <= RESTOCK_THRESHOLD;
}

// A bottle counts as "in stock" for cocktail/pour recommendations when
// there is meaningfully more than a dribble left (level 2 and above).
export function inStock(level: number) {
  return level >= 2;
}
