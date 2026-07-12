// Fine-grained spirit categories. These double as the ingredient vocabulary
// the cocktail recommender matches against.
export const CATEGORIES = [
  "Gin",
  "Vodka",
  "White Rum",
  "Dark Rum",
  "Tequila",
  "Mezcal",
  "Bourbon",
  "Rye Whiskey",
  "Scotch",
  "Irish Whiskey",
  "Cognac / Brandy",
  "Sweet Vermouth",
  "Dry Vermouth",
  "Campari / Bitter Aperitivo",
  "Aperol",
  "Orange Liqueur",
  "Coffee Liqueur",
  "Amaro",
  "Sherry / Port",
  "Champagne / Sparkling",
  "Red Wine",
  "White Wine",
  "Rosé Wine",
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

// Every fine-grained category rolls up to exactly one family.
export const CATEGORY_FAMILY: Record<Category, Family> = {
  Bourbon: "Whiskey",
  "Rye Whiskey": "Whiskey",
  Scotch: "Whiskey",
  "Irish Whiskey": "Whiskey",
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
  "Sherry / Port": "Wine",
  "Champagne / Sparkling": "Wine",
  "Red Wine": "Wine",
  "White Wine": "Wine",
  "Rosé Wine": "Wine",
  Beer: "Beer & Cider",
  Cider: "Beer & Cider",
  Bitters: "Bitters",
  Other: "Other",
};

export function familyOf(category: string): Family {
  return CATEGORY_FAMILY[category as Category] ?? "Other";
}

// Categories grouped under their family — used for grouped <select> dropdowns.
export const CATEGORIES_BY_FAMILY: { family: Family; categories: Category[] }[] = FAMILIES.map(
  (family) => ({
    family,
    categories: CATEGORIES.filter((c) => CATEGORY_FAMILY[c] === family),
  })
).filter((g) => g.categories.length > 0);
