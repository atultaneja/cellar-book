// Bottle sizes. "Unknown" is the default; these strings are also the exact
// values the photo-scanner is allowed to return, so they stay in sync.
export const SIZE_OPTIONS = [
  "Unknown",
  "50 ml",
  "60 ml",
  "180 ml",
  "200 ml",
  "375 ml",
  "500 ml",
  "700 ml",
  "750 ml",
  "1 L",
  "1.75 L",
  "2 L",
  "Other",
] as const;

export type BottleSize = (typeof SIZE_OPTIONS)[number];

export const DEFAULT_SIZE: BottleSize = "Unknown";

// Normalise a scanned/free value to one of the allowed options.
export function normalizeSize(value: string | null | undefined): BottleSize {
  if (!value) return DEFAULT_SIZE;
  const hit = SIZE_OPTIONS.find((s) => s.toLowerCase() === value.toLowerCase().trim());
  return hit ?? DEFAULT_SIZE;
}

// Total millilitres for a size label, or null when unknown/unparseable.
export function sizeToMl(size: string | null | undefined): number | null {
  if (!size) return null;
  const s = size.toLowerCase().trim();
  const ml = s.match(/^([\d.]+)\s*ml$/);
  if (ml) return Math.round(parseFloat(ml[1]));
  const l = s.match(/^([\d.]+)\s*l$/);
  if (l) return Math.round(parseFloat(l[1]) * 1000);
  return null; // "Unknown", "Other", etc.
}
