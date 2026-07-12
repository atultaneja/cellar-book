// Fine-grained categories used for cataloguing. Whiskies are broken out by
// style (incl. Indian single malt). Cocktail matching still works because each
// category maps to the base-spirit "token" recipes call for (see tokensFor).
export const CATEGORIES = [
  "Gin",
  "Vodka",
  "White Rum",
  "Dark Rum",
  "Tequila",
  "Mezcal",
  // Whiskey family — granular
  "Single Malt Scotch",
  "Blended Scotch",
  "Blended Malt Scotch",
  "Irish Whiskey",
  "Bourbon",
  "Rye Whiskey",
  "Tennessee Whiskey",
  "Japanese Whisky",
  "Indian Single Malt",
  "Other Whiskey",
  //
  "Cognac / Brandy",
  "Sweet Vermouth",
  "Dry Vermouth",
  "Campari / Bitter Aperitivo",
  "Aperol",
  "Orange Liqueur",
  "Coffee Liqueur",
  "Amaro",
  // Wine — reds
  "Cabernet Sauvignon",
  "Merlot",
  "Pinot Noir",
  "Syrah / Shiraz",
  "Malbec",
  "Red Wine",
  // Wine — whites
  "Chardonnay",
  "Sauvignon Blanc",
  "Pinot Grigio",
  "Riesling",
  "White Wine",
  // Wine — other
  "Rosé Wine",
  "Champagne / Sparkling",
  "Sherry / Port",
  "Dessert / Fortified",
  "Beer",
  "Cider",
  "Liqueur (Other)",
  "Bitters",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Broad families — the top-level way the cellar is organised and browsed.
export const FAMILIES = [
  "Whiskey",
  "Gin",
  "Vodka",
  "Rum",
  "Tequila & Agave",
  "Brandy & Cognac",
  "Aperitifs & Vermouth",
  "Liqueurs",
  "Wine",
  "Beer & Cider",
  "Bitters",
  "Other",
] as const;

export type Family = (typeof FAMILIES)[number];

export const CATEGORY_FAMILY: Record<Category, Family> = {
  "Single Malt Scotch": "Whiskey",
  "Blended Scotch": "Whiskey",
  "Blended Malt Scotch": "Whiskey",
  "Irish Whiskey": "Whiskey",
  Bourbon: "Whiskey",
  "Rye Whiskey": "Whiskey",
  "Tennessee Whiskey": "Whiskey",
  "Japanese Whisky": "Whiskey",
  "Indian Single Malt": "Whiskey",
  "Other Whiskey": "Whiskey",
  Gin: "Gin",
  Vodka: "Vodka",
  "White Rum": "Rum",
  "Dark Rum": "Rum",
  Tequila: "Tequila & Agave",
  Mezcal: "Tequila & Agave",
  "Cognac / Brandy": "Brandy & Cognac",
  "Sweet Vermouth": "Aperitifs & Vermouth",
  "Dry Vermouth": "Aperitifs & Vermouth",
  "Campari / Bitter Aperitivo": "Aperitifs & Vermouth",
  Aperol: "Aperitifs & Vermouth",
  Amaro: "Aperitifs & Vermouth",
  "Orange Liqueur": "Liqueurs",
  "Coffee Liqueur": "Liqueurs",
  "Liqueur (Other)": "Liqueurs",
  "Cabernet Sauvignon": "Wine",
  Merlot: "Wine",
  "Pinot Noir": "Wine",
  "Syrah / Shiraz": "Wine",
  Malbec: "Wine",
  "Red Wine": "Wine",
  Chardonnay: "Wine",
  "Sauvignon Blanc": "Wine",
  "Pinot Grigio": "Wine",
  Riesling: "Wine",
  "White Wine": "Wine",
  "Rosé Wine": "Wine",
  "Champagne / Sparkling": "Wine",
  "Sherry / Port": "Wine",
  "Dessert / Fortified": "Wine",
  Beer: "Beer & Cider",
  Cider: "Beer & Cider",
  Bitters: "Bitters",
  Other: "Other",
};

export function familyOf(category: string): Family {
  const fam = CATEGORY_FAMILY[category as Category];
  if (fam) return fam;
  // Graceful fallback for legacy/free-text values (e.g. an old "Scotch").
  const c = category.toLowerCase();
  if (c.includes("whisk") || c === "scotch" || c === "bourbon" || c === "rye") return "Whiskey";
  if (c.includes("wine") || c.includes("port") || c.includes("sherry") || c.includes("champagne"))
    return "Wine";
  return "Other";
}

// Categories grouped under their family — for grouped <select> dropdowns.
export const CATEGORIES_BY_FAMILY: { family: Family; categories: Category[] }[] = FAMILIES.map(
  (family) => ({
    family,
    categories: CATEGORIES.filter((c) => CATEGORY_FAMILY[c] === family),
  })
).filter((g) => g.categories.length > 0);

// Which base-spirit "tokens" a category can stand in for, for cocktail matching.
// Most categories are their own token; the granular whiskies map to the styles
// recipes reference (Scotch / Bourbon / Rye / Irish).
const CATEGORY_SATISFIES: Record<string, string[]> = {
  "Single Malt Scotch": ["Scotch"],
  "Blended Scotch": ["Scotch"],
  "Blended Malt Scotch": ["Scotch"],
  "Japanese Whisky": ["Scotch"],
  "Indian Single Malt": ["Scotch"],
  "Tennessee Whiskey": ["Bourbon"],
  "Other Whiskey": ["Scotch", "Bourbon"],
  // Bourbon, Rye Whiskey, Irish Whiskey satisfy their own name (identity).
};

export function tokensFor(category: string): string[] {
  return CATEGORY_SATISFIES[category] ?? [category];
}
