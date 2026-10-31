// Custom (host-defined) cocktails for a party. The party_cocktails table only
// stores a text `cocktail_id`, and the public guest page passes those strings
// through verbatim — so a custom cocktail is encoded entirely inside its id as
// `custom:<base64url of {id,name,description}>`. Built-in canon cocktails keep
// using their plain code-side ids. This avoids any schema change.

export const CUSTOM_PREFIX = "custom:";

export type CustomCocktail = { id: string; name: string; description: string };

export function isCustomId(id: string): boolean {
  return id.startsWith(CUSTOM_PREFIX);
}

// UTF-8-safe base64 that works in both the browser and Node (via btoa/atob,
// both globally available in our runtimes).
function b64encode(s: string): string {
  return btoa(encodeURIComponent(s));
}
function b64decode(s: string): string {
  return decodeURIComponent(atob(s));
}

export function encodeCustom(name: string, description: string): string {
  const payload: CustomCocktail = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    name: name.trim().slice(0, 80),
    description: description.trim().slice(0, 280),
  };
  return CUSTOM_PREFIX + b64encode(JSON.stringify(payload));
}

export function decodeCustom(cocktailId: string): CustomCocktail | null {
  if (!isCustomId(cocktailId)) return null;
  try {
    const parsed = JSON.parse(b64decode(cocktailId.slice(CUSTOM_PREFIX.length)));
    if (parsed && typeof parsed.name === "string" && parsed.name.trim()) {
      return {
        id: String(parsed.id ?? cocktailId),
        name: String(parsed.name),
        description: typeof parsed.description === "string" ? parsed.description : "",
      };
    }
  } catch {
    // malformed id — ignore
  }
  return null;
}
