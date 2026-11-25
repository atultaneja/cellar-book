// Shared types + schema for the Malt Advisor. The advisor runs in two steps to
// stay under the 60s serverless budget while keeping the reasoning on Opus:
//   1. /api/malt-advisor/research — fast model + web search → current findings
//   2. /api/malt-advisor/plan     — Opus 5 + deep thinking → the acquisition plan
//
// The plan is organized by GAP: each gap in the collection, then the specific
// bottles that fill it — breadth across regions/styles first, verticals later.

export type Priority = "now" | "soon" | "opportunistic";

export type Pick = {
  name: string;
  distillery: string;
  style: string; // region / cask / profile, e.g. "Islay · heavily peated · 50%"
  approx_price: string;
  priority: Priority;
  why: string; // 1 sentence: how it fills the gap (and any news hook)
};

export type Gap = {
  gap: string; // short label, e.g. "Highland Scotch — unrepresented"
  why: string; // 1 sentence on why it matters for this collection
  picks: Pick[]; // the solution(s)
};

export type WatchPick = {
  name: string;
  distillery: string;
  expected: string;
  why: string;
};

// A direct answer to a specific bottle named in the member's request. call is
// "none" when the request didn't ask about a particular bottle.
export type Verdict = {
  bottle: string;
  call: "buy" | "hold" | "skip" | "none";
  reason: string;
};

export type MaltAdvice = {
  verdict: Verdict;
  headline: string; // 1-2 sentences: the strategic direction of this plan
  gaps: Gap[];
  watch: WatchPick[];
  note: string;
};

export type Source = { title: string; url: string };

const PICK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    distillery: { type: "string" },
    style: { type: "string" },
    approx_price: { type: "string" },
    priority: { type: "string", enum: ["now", "soon", "opportunistic"] },
    why: { type: "string" },
  },
  required: ["name", "distillery", "style", "approx_price", "priority", "why"],
} as const;

export const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: {
      type: "object",
      additionalProperties: false,
      properties: {
        bottle: { type: "string" },
        call: { type: "string", enum: ["buy", "hold", "skip", "none"] },
        reason: { type: "string" },
      },
      required: ["bottle", "call", "reason"],
    },
    headline: { type: "string" },
    gaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          gap: { type: "string" },
          why: { type: "string" },
          picks: { type: "array", items: PICK_SCHEMA },
        },
        required: ["gap", "why", "picks"],
      },
    },
    watch: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          distillery: { type: "string" },
          expected: { type: "string" },
          why: { type: "string" },
        },
        required: ["name", "distillery", "expected", "why"],
      },
    },
    note: { type: "string" },
  },
  required: ["verdict", "headline", "gaps", "watch", "note"],
} as const;
