// Spirit categories. These double as the ingredient vocabulary that the
// cocktail recommender matches against.
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
  "Liqueur (Other)",
  "Bitters",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
