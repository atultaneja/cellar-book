import Anthropic from "@anthropic-ai/sdk";

// Central model choice. Sonnet 5 — near-Opus vision (bottle-label reading) and
// reasoning (the sommelier) at roughly half the cost. Swap here to change tiers.
export const MODEL = "claude-sonnet-5";

export function anthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

// Pull the first text block out of a Messages response and JSON.parse it.
// Used with output_config.format (structured outputs) where the whole text
// block is guaranteed to be schema-valid JSON.
export function parseJsonResponse<T>(content: Anthropic.ContentBlock[]): T {
  const text = content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("No text block in response");
  return JSON.parse(text.text) as T;
}
