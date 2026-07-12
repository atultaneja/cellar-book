import Anthropic from "@anthropic-ai/sdk";

// Central model choice. Opus 4.8 — strong vision (bottle-label reading) and
// reasoning (the sommelier). Swap here if you ever want a cheaper tier.
export const MODEL = "claude-opus-4-8";

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
