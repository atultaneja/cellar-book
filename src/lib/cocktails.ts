export type Mood =
  | "Aperitif"
  | "Nightcap"
  | "Celebratory"
  | "Summer"
  | "Contemplative"
  | "Crowd-pleaser";

export type Cocktail = {
  id: string;
  name: string;
  // Base-spirit tokens that MUST be in stock to make this drink
  // (matched against tokensFor(category); see categories.ts).
  requires: string[];
  // Everyday pantry items assumed on hand (shown for reference only).
  pantry: string[];
  method: string;
  moods: Mood[];
};

// A compact, club-appropriate canon. `requires` lists only the bar spirits;
// citrus, sugar, soda, tonic, eggs and ice are assumed to be on hand.
export const COCKTAILS: Cocktail[] = [
  {
    id: "negroni",
    name: "Negroni",
    requires: ["Gin", "Sweet Vermouth", "Campari / Bitter Aperitivo"],
    pantry: ["Orange peel"],
    method: "Equal parts gin, sweet vermouth and Campari. Stir over ice, strain onto a large cube, orange peel.",
    moods: ["Aperitif", "Contemplative"],
  },
  {
    id: "martini",
    name: "Dry Martini",
    requires: ["Gin", "Dry Vermouth"],
    pantry: ["Olive or lemon peel"],
    method: "2.5 oz gin, 0.5 oz dry vermouth. Stir long over ice, strain, express a lemon peel.",
    moods: ["Aperitif", "Contemplative"],
  },
  {
    id: "vodka-martini",
    name: "Vodka Martini",
    requires: ["Vodka", "Dry Vermouth"],
    pantry: ["Olive or lemon peel"],
    method: "2.5 oz vodka, 0.5 oz dry vermouth. Stir, strain, garnish.",
    moods: ["Aperitif"],
  },
  {
    id: "manhattan",
    name: "Manhattan",
    requires: ["Rye Whiskey", "Sweet Vermouth", "Bitters"],
    pantry: ["Cherry"],
    method: "2 oz rye, 1 oz sweet vermouth, 2 dashes bitters. Stir, strain up, cherry.",
    moods: ["Nightcap", "Contemplative"],
  },
  {
    id: "old-fashioned",
    name: "Old Fashioned",
    requires: ["Bourbon", "Bitters"],
    pantry: ["Sugar", "Orange peel"],
    method: "2 oz bourbon, sugar cube, 3 dashes bitters. Muddle, build over a large cube, orange peel.",
    moods: ["Nightcap", "Contemplative"],
  },
  {
    id: "whiskey-sour",
    name: "Whiskey Sour",
    requires: ["Bourbon"],
    pantry: ["Lemon", "Sugar", "Egg white (optional)"],
    method: "2 oz bourbon, 0.75 oz lemon, 0.75 oz simple. Shake (dry then wet if using egg white), strain.",
    moods: ["Crowd-pleaser", "Summer"],
  },
  {
    id: "boulevardier",
    name: "Boulevardier",
    requires: ["Bourbon", "Sweet Vermouth", "Campari / Bitter Aperitivo"],
    pantry: ["Orange peel"],
    method: "1.5 oz bourbon, 1 oz sweet vermouth, 1 oz Campari. Stir, strain, orange peel.",
    moods: ["Aperitif", "Nightcap"],
  },
  {
    id: "daiquiri",
    name: "Daiquiri",
    requires: ["White Rum"],
    pantry: ["Lime", "Sugar"],
    method: "2 oz white rum, 1 oz lime, 0.75 oz simple. Shake hard, double strain, up.",
    moods: ["Summer", "Crowd-pleaser"],
  },
  {
    id: "mojito",
    name: "Mojito",
    requires: ["White Rum"],
    pantry: ["Lime", "Sugar", "Mint", "Soda"],
    method: "Muddle mint & sugar with lime, 2 oz rum, ice, top soda.",
    moods: ["Summer", "Crowd-pleaser"],
  },
  {
    id: "dark-n-stormy",
    name: "Dark 'n' Stormy",
    requires: ["Dark Rum"],
    pantry: ["Lime", "Ginger beer"],
    method: "Build 2 oz dark rum over ice, top ginger beer, lime.",
    moods: ["Summer", "Crowd-pleaser"],
  },
  {
    id: "margarita",
    name: "Margarita",
    requires: ["Tequila", "Orange Liqueur"],
    pantry: ["Lime", "Salt"],
    method: "2 oz tequila, 1 oz orange liqueur, 1 oz lime. Shake, strain, salted rim.",
    moods: ["Summer", "Crowd-pleaser"],
  },
  {
    id: "tommys-margarita",
    name: "Tommy's Margarita",
    requires: ["Tequila"],
    pantry: ["Lime", "Agave"],
    method: "2 oz tequila, 1 oz lime, 0.5 oz agave. Shake, strain.",
    moods: ["Summer"],
  },
  {
    id: "paloma",
    name: "Paloma",
    requires: ["Tequila"],
    pantry: ["Lime", "Grapefruit soda", "Salt"],
    method: "2 oz tequila, 0.5 oz lime, top grapefruit soda, salted rim.",
    moods: ["Summer", "Crowd-pleaser"],
  },
  {
    id: "mezcal-negroni",
    name: "Mezcal Negroni",
    requires: ["Mezcal", "Sweet Vermouth", "Campari / Bitter Aperitivo"],
    pantry: ["Orange peel"],
    method: "Equal parts mezcal, sweet vermouth, Campari. Stir, strain, orange peel.",
    moods: ["Aperitif", "Contemplative"],
  },
  {
    id: "gin-tonic",
    name: "Gin & Tonic",
    requires: ["Gin"],
    pantry: ["Tonic", "Lime"],
    method: "2 oz gin over ice, top good tonic, lime or grapefruit.",
    moods: ["Aperitif", "Summer", "Crowd-pleaser"],
  },
  {
    id: "tom-collins",
    name: "Tom Collins",
    requires: ["Gin"],
    pantry: ["Lemon", "Sugar", "Soda"],
    method: "2 oz gin, 1 oz lemon, 0.5 oz simple, top soda.",
    moods: ["Summer", "Crowd-pleaser"],
  },
  {
    id: "aperol-spritz",
    name: "Aperol Spritz",
    requires: ["Aperol", "Champagne / Sparkling"],
    pantry: ["Soda", "Orange"],
    method: "3 parts prosecco, 2 parts Aperol, 1 splash soda over ice, orange slice.",
    moods: ["Aperitif", "Summer", "Celebratory"],
  },
  {
    id: "americano",
    name: "Americano",
    requires: ["Campari / Bitter Aperitivo", "Sweet Vermouth"],
    pantry: ["Soda", "Orange"],
    method: "1 oz Campari, 1 oz sweet vermouth, top soda, orange.",
    moods: ["Aperitif"],
  },
  {
    id: "espresso-martini",
    name: "Espresso Martini",
    requires: ["Vodka", "Coffee Liqueur"],
    pantry: ["Fresh espresso"],
    method: "1.5 oz vodka, 1 oz coffee liqueur, 1 shot espresso. Shake hard, double strain.",
    moods: ["Celebratory", "Nightcap"],
  },
  {
    id: "white-russian",
    name: "White Russian",
    requires: ["Vodka", "Coffee Liqueur"],
    pantry: ["Cream"],
    method: "2 oz vodka, 1 oz coffee liqueur over ice, float cream.",
    moods: ["Nightcap"],
  },
  {
    id: "sidecar",
    name: "Sidecar",
    requires: ["Cognac / Brandy", "Orange Liqueur"],
    pantry: ["Lemon", "Sugar rim"],
    method: "2 oz cognac, 0.75 oz orange liqueur, 0.75 oz lemon. Shake, strain, sugar rim.",
    moods: ["Contemplative", "Celebratory"],
  },
  {
    id: "sazerac",
    name: "Sazerac",
    requires: ["Rye Whiskey", "Bitters"],
    pantry: ["Sugar", "Absinthe rinse", "Lemon peel"],
    method: "Absinthe rinse. 2 oz rye, sugar, bitters. Stir, strain into chilled glass, lemon peel.",
    moods: ["Nightcap", "Contemplative"],
  },
  {
    id: "rob-roy",
    name: "Rob Roy",
    requires: ["Scotch", "Sweet Vermouth", "Bitters"],
    pantry: ["Cherry"],
    method: "2 oz Scotch, 1 oz sweet vermouth, 2 dashes bitters. Stir, strain, cherry.",
    moods: ["Nightcap", "Contemplative"],
  },
  {
    id: "penicillin",
    name: "Penicillin",
    requires: ["Scotch"],
    pantry: ["Lemon", "Honey", "Fresh ginger"],
    method: "2 oz blended Scotch, 0.75 oz lemon, 0.75 oz honey-ginger. Shake, strain, float smoky Scotch.",
    moods: ["Contemplative", "Nightcap"],
  },
  {
    id: "champagne-cocktail",
    name: "Champagne Cocktail",
    requires: ["Champagne / Sparkling", "Cognac / Brandy", "Bitters"],
    pantry: ["Sugar cube"],
    method: "Sugar cube soaked in bitters, 0.5 oz cognac, top Champagne.",
    moods: ["Celebratory"],
  },
  {
    id: "kir-royale",
    name: "Kir Royale",
    requires: ["Champagne / Sparkling", "Liqueur (Other)"],
    pantry: ["Crème de cassis"],
    method: "0.5 oz cassis, top Champagne.",
    moods: ["Celebratory", "Aperitif"],
  },
];

export function makeable(cocktail: Cocktail, availableCategories: Set<string>): boolean {
  return cocktail.requires.every((c) => availableCategories.has(c));
}

// How many required spirits are missing — used to surface "almost there" drinks.
export function missingCount(cocktail: Cocktail, availableCategories: Set<string>): number {
  return cocktail.requires.filter((c) => !availableCategories.has(c)).length;
}

export function cocktailById(id: string): Cocktail | undefined {
  return COCKTAILS.find((c) => c.id === id);
}

// Neat / on-the-rocks pour suggestions keyed by the spirit category in hand.
export const NEAT_POURS: Record<string, { mood: Mood; note: string }> = {
  Scotch: { mood: "Contemplative", note: "A measure neat, a drop of water to open it up." },
  "Irish Whiskey": { mood: "Nightcap", note: "Neat, or over a single large cube." },
  Bourbon: { mood: "Nightcap", note: "Over one big rock; let it soften a minute." },
  "Rye Whiskey": { mood: "Contemplative", note: "Neat — the spice carries." },
  "Cognac / Brandy": { mood: "Nightcap", note: "Warm the snifter in the palm; sip slowly." },
  "Dark Rum": { mood: "Nightcap", note: "Sip neat like a fine spirit." },
  Mezcal: { mood: "Contemplative", note: "Neat in a copita, orange & salt alongside." },
  Amaro: { mood: "Nightcap", note: "Chilled, neat — a proper digestif." },
  "Sherry / Port": { mood: "Nightcap", note: "A small glass to close the evening." },
  Tequila: { mood: "Celebratory", note: "A good añejo, sipped neat." },
};
