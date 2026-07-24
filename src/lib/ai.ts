import Anthropic from "@anthropic-ai/sdk";

// Vision + light background tasks: Sonnet 5 (strong label reading, cheap).
export const MODEL = "claude-sonnet-5";

// The interactive sommelier: top model + thinking, for creative, occasion-aware
// picks. It's used occasionally, so the extra cost is a few cents at most.
export const MODEL_SOMMELIER = "claude-opus-4-8";

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
