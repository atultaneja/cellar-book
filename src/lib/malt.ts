// Shared types + schema for the Malt Advisor. The advisor runs in two steps to
// stay under the 60s serverless budget while keeping the reasoning on Opus:
//   1. /api/malt-advisor/research — fast model + web search → current findings
//   2. /api/malt-advisor/plan     — Opus 5 + deep thinking → the acquisition plan

export type AcquirePick = {
  name: string;
  distillery: string;
  style: string; // region / cask / profile
  approx_price: string;
  priority: "now" | "soon" | "opportunistic";
  why: string;
};

export type WatchPick = {
  name: string;
  distillery: string;
  expected: string;
  why: string;
};

export type MaltAdvice = {
  assessment: string;
  strategy: string;
  acquire: AcquirePick[];
  watch: WatchPick[];
  note: string;
};

export type Source = { title: string; url: string };

// Structured-output schema for the plan step (no tools in that call, so
// output_config.format is safe to use for guaranteed-valid JSON).
export const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    assessment: { type: "string" },
    strategy: { type: "string" },
    acquire: {
      type: "array",
      items: {
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
  required: ["assessment", "strategy", "acquire", "watch", "note"],
} as const;
