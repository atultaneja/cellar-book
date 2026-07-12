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
  method: string; // one-line summary for compact cards
  glass: string;
  ingredients: string[]; // full build with measures
  steps: string[]; // step-by-step preparation
  garnish?: string;
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
    method: "Equal parts gin, sweet vermouth and Campari, stirred, orange peel.",
    glass: "Rocks glass over a large cube",
    ingredients: ["30 ml (1 oz) gin", "30 ml (1 oz) sweet vermouth", "30 ml (1 oz) Campari"],
    steps: [
      "Add all three to a mixing glass with ice.",
      "Stir 20–30 seconds until well chilled.",
      "Strain over one large cube in a rocks glass.",
      "Express an orange peel over the top and drop it in.",
    ],
    garnish: "Orange peel",
    moods: ["Aperitif", "Contemplative"],
  },
  {
    id: "martini",
    name: "Dry Martini",
    requires: ["Gin", "Dry Vermouth"],
    pantry: ["Olive or lemon peel"],
    method: "Gin and a touch of dry vermouth, stirred long, up.",
    glass: "Chilled coupe or martini glass",
    ingredients: ["75 ml (2.5 oz) gin", "15 ml (0.5 oz) dry vermouth"],
    steps: [
      "Chill the glass with ice water.",
      "Stir gin and vermouth over plenty of ice for 30 seconds.",
      "Strain into the chilled glass.",
      "Garnish with an olive or a lemon twist.",
    ],
    garnish: "Olive or lemon twist",
    moods: ["Aperitif", "Contemplative"],
  },
  {
    id: "vodka-martini",
    name: "Vodka Martini",
    requires: ["Vodka", "Dry Vermouth"],
    pantry: ["Olive or lemon peel"],
    method: "Vodka and dry vermouth, stirred, up.",
    glass: "Chilled coupe or martini glass",
    ingredients: ["75 ml (2.5 oz) vodka", "15 ml (0.5 oz) dry vermouth"],
    steps: [
      "Stir vodka and vermouth over ice for 30 seconds.",
      "Strain into a chilled glass.",
      "Garnish with an olive or lemon twist.",
    ],
    garnish: "Olive or lemon twist",
    moods: ["Aperitif"],
  },
  {
    id: "manhattan",
    name: "Manhattan",
    requires: ["Rye Whiskey", "Sweet Vermouth", "Bitters"],
    pantry: ["Cherry"],
    method: "Rye, sweet vermouth and bitters, stirred, up.",
    glass: "Chilled coupe",
    ingredients: [
      "60 ml (2 oz) rye whiskey",
      "30 ml (1 oz) sweet vermouth",
      "2 dashes Angostura bitters",
    ],
    steps: [
      "Stir all ingredients over ice for 30 seconds.",
      "Strain into a chilled coupe.",
      "Garnish with a cherry.",
    ],
    garnish: "Brandied cherry",
    moods: ["Nightcap", "Contemplative"],
  },
  {
    id: "old-fashioned",
    name: "Old Fashioned",
    requires: ["Bourbon", "Bitters"],
    pantry: ["Sugar", "Orange peel"],
    method: "Bourbon, sugar and bitters, built over a big cube.",
    glass: "Rocks glass over a large cube",
    ingredients: [
      "60 ml (2 oz) bourbon",
      "1 sugar cube (or 1 tsp sugar)",
      "3 dashes Angostura bitters",
      "Splash of water",
    ],
    steps: [
      "Muddle the sugar with bitters and a splash of water until dissolved.",
      "Add bourbon and one large cube.",
      "Stir gently to chill and dilute.",
      "Express an orange peel over the top and drop it in.",
    ],
    garnish: "Orange peel",
    moods: ["Nightcap", "Contemplative"],
  },
  {
    id: "whiskey-sour",
    name: "Whiskey Sour",
    requires: ["Bourbon"],
    pantry: ["Lemon", "Sugar", "Egg white (optional)"],
    method: "Bourbon, lemon and sugar, shaken (egg white optional).",
    glass: "Rocks glass or coupe",
    ingredients: [
      "60 ml (2 oz) bourbon",
      "22 ml (0.75 oz) lemon juice",
      "22 ml (0.75 oz) simple syrup",
      "1 egg white (optional, for foam)",
    ],
    steps: [
      "If using egg white, dry-shake everything without ice first.",
      "Add ice and shake hard until chilled.",
      "Strain into a rocks glass over fresh ice (or a coupe, up).",
      "Optional: a few drops of bitters on the foam.",
    ],
    garnish: "Lemon or a cherry",
    moods: ["Crowd-pleaser", "Summer"],
  },
  {
    id: "boulevardier",
    name: "Boulevardier",
    requires: ["Bourbon", "Sweet Vermouth", "Campari / Bitter Aperitivo"],
    pantry: ["Orange peel"],
    method: "The whiskey Negroni — bourbon, sweet vermouth, Campari.",
    glass: "Rocks glass over a large cube",
    ingredients: [
      "45 ml (1.5 oz) bourbon",
      "30 ml (1 oz) sweet vermouth",
      "30 ml (1 oz) Campari",
    ],
    steps: [
      "Stir all ingredients over ice for 20–30 seconds.",
      "Strain over a large cube (or up in a coupe).",
      "Express an orange peel and drop it in.",
    ],
    garnish: "Orange peel",
    moods: ["Aperitif", "Nightcap"],
  },
  {
    id: "daiquiri",
    name: "Daiquiri",
    requires: ["White Rum"],
    pantry: ["Lime", "Sugar"],
    method: "White rum, lime and sugar, shaken hard, up.",
    glass: "Chilled coupe",
    ingredients: [
      "60 ml (2 oz) white rum",
      "30 ml (1 oz) lime juice",
      "22 ml (0.75 oz) simple syrup",
    ],
    steps: [
      "Shake all ingredients hard over ice until very cold.",
      "Double-strain into a chilled coupe.",
    ],
    garnish: "Lime wheel (optional)",
    moods: ["Summer", "Crowd-pleaser"],
  },
  {
    id: "mojito",
    name: "Mojito",
    requires: ["White Rum"],
    pantry: ["Lime", "Sugar", "Mint", "Soda"],
    method: "Muddled mint & lime, white rum, topped with soda.",
    glass: "Highball",
    ingredients: [
      "60 ml (2 oz) white rum",
      "22 ml (0.75 oz) lime juice",
      "2 tsp sugar",
      "6–8 mint leaves",
      "Soda water to top",
    ],
    steps: [
      "Gently press mint with sugar and lime in the glass (don't shred it).",
      "Add rum and fill with crushed ice.",
      "Top with soda and stir up from the bottom.",
    ],
    garnish: "Mint sprig",
    moods: ["Summer", "Crowd-pleaser"],
  },
  {
    id: "dark-n-stormy",
    name: "Dark 'n' Stormy",
    requires: ["Dark Rum"],
    pantry: ["Lime", "Ginger beer"],
    method: "Dark rum floated over ginger beer and lime.",
    glass: "Highball",
    ingredients: ["60 ml (2 oz) dark rum", "15 ml (0.5 oz) lime juice", "Ginger beer to top"],
    steps: [
      "Fill a highball with ice, add lime and ginger beer.",
      "Float the dark rum on top so it streams down.",
    ],
    garnish: "Lime wedge",
    moods: ["Summer", "Crowd-pleaser"],
  },
  {
    id: "margarita",
    name: "Margarita",
    requires: ["Tequila", "Orange Liqueur"],
    pantry: ["Lime", "Salt"],
    method: "Tequila, orange liqueur and lime, shaken, salted rim.",
    glass: "Rocks glass, salted rim",
    ingredients: [
      "60 ml (2 oz) tequila (blanco)",
      "30 ml (1 oz) orange liqueur",
      "30 ml (1 oz) lime juice",
    ],
    steps: [
      "Salt half the rim of a rocks glass.",
      "Shake tequila, orange liqueur and lime over ice.",
      "Strain over fresh ice.",
    ],
    garnish: "Lime wheel",
    moods: ["Summer", "Crowd-pleaser"],
  },
  {
    id: "tommys-margarita",
    name: "Tommy's Margarita",
    requires: ["Tequila"],
    pantry: ["Lime", "Agave"],
    method: "Tequila, lime and agave — no liqueur.",
    glass: "Rocks glass",
    ingredients: ["60 ml (2 oz) tequila", "30 ml (1 oz) lime juice", "15 ml (0.5 oz) agave syrup"],
    steps: ["Shake all over ice until cold.", "Strain over fresh ice."],
    garnish: "Lime wheel",
    moods: ["Summer"],
  },
  {
    id: "paloma",
    name: "Paloma",
    requires: ["Tequila"],
    pantry: ["Lime", "Grapefruit soda", "Salt"],
    method: "Tequila and lime, topped with grapefruit soda.",
    glass: "Highball, salted rim",
    ingredients: [
      "60 ml (2 oz) tequila",
      "15 ml (0.5 oz) lime juice",
      "Grapefruit soda to top",
      "Pinch of salt",
    ],
    steps: [
      "Salt the rim; fill the glass with ice.",
      "Add tequila, lime and a pinch of salt.",
      "Top with grapefruit soda and stir gently.",
    ],
    garnish: "Grapefruit or lime wedge",
    moods: ["Summer", "Crowd-pleaser"],
  },
  {
    id: "mezcal-negroni",
    name: "Mezcal Negroni",
    requires: ["Mezcal", "Sweet Vermouth", "Campari / Bitter Aperitivo"],
    pantry: ["Orange peel"],
    method: "A smoky Negroni built on mezcal.",
    glass: "Rocks glass over a large cube",
    ingredients: [
      "30 ml (1 oz) mezcal",
      "30 ml (1 oz) sweet vermouth",
      "30 ml (1 oz) Campari",
    ],
    steps: [
      "Stir all over ice for 20–30 seconds.",
      "Strain over a large cube.",
      "Express an orange peel and drop it in.",
    ],
    garnish: "Orange peel",
    moods: ["Aperitif", "Contemplative"],
  },
  {
    id: "gin-tonic",
    name: "Gin & Tonic",
    requires: ["Gin"],
    pantry: ["Tonic", "Lime"],
    method: "Gin over ice, topped with good tonic.",
    glass: "Highball or copa",
    ingredients: ["60 ml (2 oz) gin", "Tonic water to top (about 120 ml)"],
    steps: [
      "Fill the glass with plenty of ice.",
      "Add gin, then top with cold tonic.",
      "Stir once; garnish.",
    ],
    garnish: "Lime wedge or grapefruit peel",
    moods: ["Aperitif", "Summer", "Crowd-pleaser"],
  },
  {
    id: "tom-collins",
    name: "Tom Collins",
    requires: ["Gin"],
    pantry: ["Lemon", "Sugar", "Soda"],
    method: "Gin, lemon and sugar, lengthened with soda.",
    glass: "Collins glass",
    ingredients: [
      "60 ml (2 oz) gin",
      "30 ml (1 oz) lemon juice",
      "15 ml (0.5 oz) simple syrup",
      "Soda water to top",
    ],
    steps: [
      "Shake gin, lemon and syrup over ice.",
      "Strain into an ice-filled Collins glass.",
      "Top with soda and stir gently.",
    ],
    garnish: "Lemon wheel and cherry",
    moods: ["Summer", "Crowd-pleaser"],
  },
  {
    id: "aperol-spritz",
    name: "Aperol Spritz",
    requires: ["Aperol", "Champagne / Sparkling"],
    pantry: ["Soda", "Orange"],
    method: "3–2–1: prosecco, Aperol, soda.",
    glass: "Large wine glass",
    ingredients: [
      "90 ml (3 parts) prosecco",
      "60 ml (2 parts) Aperol",
      "Splash of soda",
    ],
    steps: [
      "Fill a wine glass with ice.",
      "Add prosecco, then Aperol, then a splash of soda.",
      "Stir once, gently.",
    ],
    garnish: "Orange slice",
    moods: ["Aperitif", "Summer", "Celebratory"],
  },
  {
    id: "americano",
    name: "Americano",
    requires: ["Campari / Bitter Aperitivo", "Sweet Vermouth"],
    pantry: ["Soda", "Orange"],
    method: "Campari and sweet vermouth, topped with soda.",
    glass: "Highball or rocks",
    ingredients: [
      "30 ml (1 oz) Campari",
      "30 ml (1 oz) sweet vermouth",
      "Soda water to top",
    ],
    steps: [
      "Build Campari and vermouth over ice.",
      "Top with soda and stir gently.",
    ],
    garnish: "Orange slice",
    moods: ["Aperitif"],
  },
  {
    id: "espresso-martini",
    name: "Espresso Martini",
    requires: ["Vodka", "Coffee Liqueur"],
    pantry: ["Fresh espresso"],
    method: "Vodka, coffee liqueur and fresh espresso, shaken hard.",
    glass: "Chilled coupe",
    ingredients: [
      "45 ml (1.5 oz) vodka",
      "30 ml (1 oz) coffee liqueur",
      "30 ml (1 oz) fresh espresso, hot",
    ],
    steps: [
      "Shake all ingredients very hard over ice (this builds the foam).",
      "Double-strain into a chilled coupe.",
    ],
    garnish: "Three coffee beans",
    moods: ["Celebratory", "Nightcap"],
  },
  {
    id: "white-russian",
    name: "White Russian",
    requires: ["Vodka", "Coffee Liqueur"],
    pantry: ["Cream"],
    method: "Vodka and coffee liqueur, floated with cream.",
    glass: "Rocks glass",
    ingredients: [
      "60 ml (2 oz) vodka",
      "30 ml (1 oz) coffee liqueur",
      "30 ml (1 oz) cream",
    ],
    steps: [
      "Build vodka and coffee liqueur over ice.",
      "Float the cream on top and stir gently before drinking.",
    ],
    moods: ["Nightcap"],
  },
  {
    id: "sidecar",
    name: "Sidecar",
    requires: ["Cognac / Brandy", "Orange Liqueur"],
    pantry: ["Lemon", "Sugar rim"],
    method: "Cognac, orange liqueur and lemon, shaken, sugar rim.",
    glass: "Coupe, sugared rim",
    ingredients: [
      "60 ml (2 oz) cognac",
      "22 ml (0.75 oz) orange liqueur",
      "22 ml (0.75 oz) lemon juice",
    ],
    steps: [
      "Sugar the rim of a chilled coupe.",
      "Shake all ingredients over ice.",
      "Double-strain into the coupe.",
    ],
    garnish: "Orange peel",
    moods: ["Contemplative", "Celebratory"],
  },
  {
    id: "sazerac",
    name: "Sazerac",
    requires: ["Rye Whiskey", "Bitters"],
    pantry: ["Sugar", "Absinthe rinse", "Lemon peel"],
    method: "Rye and bitters in an absinthe-rinsed glass.",
    glass: "Chilled rocks glass",
    ingredients: [
      "60 ml (2 oz) rye whiskey",
      "1 sugar cube (or 1 tsp)",
      "3 dashes Peychaud's (or Angostura) bitters",
      "Absinthe, to rinse",
    ],
    steps: [
      "Rinse a chilled rocks glass with absinthe; discard the excess.",
      "Muddle sugar with bitters and a little water in a mixing glass.",
      "Add rye and ice; stir until cold.",
      "Strain into the rinsed glass (no ice). Twist a lemon peel over and discard.",
    ],
    garnish: "Lemon peel (expressed, discarded)",
    moods: ["Nightcap", "Contemplative"],
  },
  {
    id: "rob-roy",
    name: "Rob Roy",
    requires: ["Scotch", "Sweet Vermouth", "Bitters"],
    pantry: ["Cherry"],
    method: "A Manhattan made with Scotch.",
    glass: "Chilled coupe",
    ingredients: [
      "60 ml (2 oz) blended Scotch",
      "30 ml (1 oz) sweet vermouth",
      "2 dashes Angostura bitters",
    ],
    steps: ["Stir all over ice for 30 seconds.", "Strain into a chilled coupe.", "Add a cherry."],
    garnish: "Brandied cherry",
    moods: ["Nightcap", "Contemplative"],
  },
  {
    id: "penicillin",
    name: "Penicillin",
    requires: ["Scotch"],
    pantry: ["Lemon", "Honey", "Fresh ginger"],
    method: "Scotch, lemon, honey-ginger, with a smoky float.",
    glass: "Rocks glass over ice",
    ingredients: [
      "60 ml (2 oz) blended Scotch",
      "22 ml (0.75 oz) lemon juice",
      "22 ml (0.75 oz) honey-ginger syrup",
      "7 ml (0.25 oz) peaty Scotch, to float",
    ],
    steps: [
      "Shake blended Scotch, lemon and honey-ginger syrup over ice.",
      "Strain over fresh ice in a rocks glass.",
      "Float the peaty Scotch on top.",
    ],
    garnish: "Candied ginger",
    moods: ["Contemplative", "Nightcap"],
  },
  {
    id: "champagne-cocktail",
    name: "Champagne Cocktail",
    requires: ["Champagne / Sparkling", "Cognac / Brandy", "Bitters"],
    pantry: ["Sugar cube"],
    method: "A bitters-soaked sugar cube under Champagne.",
    glass: "Flute or coupe",
    ingredients: [
      "1 sugar cube",
      "Angostura bitters, to soak",
      "15 ml (0.5 oz) cognac",
      "Champagne to top",
    ],
    steps: [
      "Soak the sugar cube with bitters and drop it in the glass.",
      "Add the cognac.",
      "Top slowly with cold Champagne.",
    ],
    garnish: "Lemon twist",
    moods: ["Celebratory"],
  },
  {
    id: "kir-royale",
    name: "Kir Royale",
    requires: ["Champagne / Sparkling", "Liqueur (Other)"],
    pantry: ["Crème de cassis"],
    method: "Cassis topped with Champagne.",
    glass: "Flute",
    ingredients: ["15 ml (0.5 oz) crème de cassis", "Champagne to top"],
    steps: ["Add cassis to a flute.", "Top slowly with cold Champagne."],
    garnish: "Optional lemon twist",
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

// Neat / on-the-rocks pour suggestions keyed by the spirit token in hand.
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
