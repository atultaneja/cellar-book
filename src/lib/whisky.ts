// Deriving collection facets (region, type, cask, age) for single malts from the
// data we already store — name, brand, category, notes. There is no dedicated
// region/cask/age column, so region comes from a distillery lookup and cask/age
// are parsed from the label text. Anything we can't determine falls into an
// honest "Unspecified" bucket rather than a guess.

import type { Bottle } from "./types";

export const MALT_CATEGORIES = [
  "Single Malt Scotch",
  "Blended Malt Scotch",
  "Japanese Whisky",
  "Indian Single Malt",
] as const;

export function isMalt(category: string): boolean {
  return (MALT_CATEGORIES as readonly string[]).includes(category);
}

// Friendly type label, straight from the catalogue category.
export function typeOf(b: Bottle): string {
  switch (b.category) {
    case "Single Malt Scotch":
      return "Single Malt Scotch";
    case "Blended Malt Scotch":
      return "Blended Malt Scotch";
    case "Japanese Whisky":
      return "Japanese";
    case "Indian Single Malt":
      return "Indian";
    default:
      return b.category;
  }
}

// Common single-malt distilleries → Scotch region. Lowercase keys; matched as a
// substring of "brand + name". Not exhaustive, but covers the usual suspects.
const DISTILLERY_REGION: Record<string, string> = {
  // Islay
  ardbeg: "Islay",
  lagavulin: "Islay",
  laphroaig: "Islay",
  bowmore: "Islay",
  bruichladdich: "Islay",
  bunnahabhain: "Islay",
  caol: "Islay", // Caol Ila
  kilchoman: "Islay",
  "port charlotte": "Islay",
  octomore: "Islay",
  "port ellen": "Islay",
  // Speyside
  macallan: "Speyside",
  glenfiddich: "Speyside",
  glenlivet: "Speyside",
  balvenie: "Speyside",
  aberlour: "Speyside",
  glenfarclas: "Speyside",
  "glen grant": "Speyside",
  glenrothes: "Speyside",
  cragganmore: "Speyside",
  mortlach: "Speyside",
  benriach: "Speyside",
  benromach: "Speyside",
  cardhu: "Speyside",
  tamdhu: "Speyside",
  craigellachie: "Speyside",
  "glen moray": "Speyside",
  linkwood: "Speyside",
  longmorn: "Speyside",
  strathisla: "Speyside",
  speyburn: "Speyside",
  // Highland
  glenmorangie: "Highland",
  oban: "Highland",
  dalmore: "Highland",
  glendronach: "Highland",
  "old pulteney": "Highland",
  balblair: "Highland",
  clynelish: "Highland",
  glengoyne: "Highland",
  dalwhinnie: "Highland",
  aberfeldy: "Highland",
  edradour: "Highland",
  "royal lochnagar": "Highland",
  tomatin: "Highland",
  deanston: "Highland",
  ardnamurchan: "Highland",
  // Lowland
  auchentoshan: "Lowland",
  glenkinchie: "Lowland",
  bladnoch: "Lowland",
  ailsa: "Lowland",
  // Campbeltown
  springbank: "Campbeltown",
  "glen scotia": "Campbeltown",
  kilkerran: "Campbeltown",
  longrow: "Campbeltown",
  hazelburn: "Campbeltown",
  // Islands (not Islay)
  talisker: "Islands",
  highland: "Islands", // Highland Park (Orkney)
  scapa: "Islands",
  jura: "Islands",
  arran: "Islands",
  tobermory: "Islands",
  ledaig: "Islands",
  raasay: "Islands",
};

export function regionOf(b: Bottle): string {
  // Japanese / Indian collections are grouped by their country of origin.
  if (b.category === "Japanese Whisky") return "Japan";
  if (b.category === "Indian Single Malt") return "India";

  const hay = `${b.brand ?? ""} ${b.name}`.toLowerCase();
  for (const [key, region] of Object.entries(DISTILLERY_REGION)) {
    if (hay.includes(key)) return region;
  }
  return "Unspecified";
}

// Cask influence, parsed from the label text. Order matters — more specific
// terms first. Returns the first match, else "Unspecified".
const CASK_RULES: { label: string; terms: string[] }[] = [
  { label: "PX Sherry", terms: ["pedro ximenez", "pedro ximénez", " px", "px "] },
  { label: "Oloroso Sherry", terms: ["oloroso"] },
  { label: "Sherry", terms: ["sherry", "amontillado", "fino", "manzanilla"] },
  { label: "Port", terms: ["port", "quinta"] },
  { label: "Wine", terms: ["wine", "sauternes", "burgundy", "bordeaux", "cabernet", "moscatel"] },
  { label: "Madeira", terms: ["madeira"] },
  { label: "Rum", terms: ["rum"] },
  { label: "Cognac", terms: ["cognac"] },
  { label: "Virgin Oak", terms: ["virgin oak", "new oak"] },
  { label: "Bourbon", terms: ["bourbon", "ex-bourbon", "first-fill bourbon"] },
];

export function caskOf(b: Bottle): string {
  const hay = ` ${`${b.name} ${b.notes ?? ""}`.toLowerCase()} `;
  for (const rule of CASK_RULES) {
    if (rule.terms.some((t) => hay.includes(t))) return rule.label;
  }
  return "Unspecified";
}

// Age statement parsed from the name (e.g. "Glenfiddich 12", "Macallan 18 Year").
// Treats a standalone 8–40 as an age; otherwise "NAS" (no age statement).
export function ageOf(b: Bottle): string {
  const m = b.name.match(/\b(\d{1,2})\s*(?:yo|y\.?o\.?|years?|yr)\b/i);
  if (m) return `${m[1]} yr`;
  const bare = b.name.match(/\b(\d{1,2})\b/);
  if (bare) {
    const n = Number(bare[1]);
    if (n >= 8 && n <= 40) return `${n} yr`;
  }
  return "NAS";
}

export type Facet = "region" | "type" | "cask" | "age";

export const FACET_LABEL: Record<Facet, string> = {
  region: "Region",
  type: "Type",
  cask: "Cask",
  age: "Age",
};

// A saved, per-bottle correction/enrichment that overrides the heuristics.
export type FacetOverride = { region?: string; cask?: string; age?: string };
export type Overrides = Record<string, FacetOverride>;

export const SOFT_LABELS = new Set(["Unspecified", "NAS"]);

export function facetValue(b: Bottle, facet: Facet, overrides?: Overrides): string {
  const ov = overrides?.[b.id];
  if (facet !== "type" && ov && ov[facet]) return ov[facet] as string;
  switch (facet) {
    case "region":
      return regionOf(b);
    case "type":
      return typeOf(b);
    case "cask":
      return caskOf(b);
    case "age":
      return ageOf(b);
  }
}

// True when a bottle still lacks a real region, cask or age (nothing derived and
// nothing saved) — i.e. a candidate for one-time enrichment.
export function needsEnrichment(b: Bottle, overrides?: Overrides): boolean {
  return (
    SOFT_LABELS.has(facetValue(b, "region", overrides)) ||
    SOFT_LABELS.has(facetValue(b, "cask", overrides)) ||
    SOFT_LABELS.has(facetValue(b, "age", overrides))
  );
}

export type Group = { label: string; total: number; inStock: number; items: Bottle[] };

// Group bottles by a facet, biggest group first, with "Unspecified"/"NAS" sunk
// to the bottom so the meaningful buckets lead.
export function groupBy(bottles: Bottle[], facet: Facet, overrides?: Overrides): Group[] {
  const map = new Map<string, Group>();
  for (const b of bottles) {
    const label = facetValue(b, facet, overrides);
    const g = map.get(label) ?? { label, total: 0, inStock: 0, items: [] };
    g.total += 1;
    if (b.level > 0) g.inStock += 1;
    g.items.push(b);
    map.set(label, g);
  }
  return Array.from(map.values()).sort((a, b) => {
    const aSoft = SOFT_LABELS.has(a.label) ? 1 : 0;
    const bSoft = SOFT_LABELS.has(b.label) ? 1 : 0;
    if (aSoft !== bSoft) return aSoft - bSoft;
    return b.total - a.total;
  });
}
