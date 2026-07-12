// The taste profile is the app's long-term memory of your palate. It persists
// per-user and feeds both the interactive sommelier and the weekly email pick.

export type TasteProfile = {
  spirits: string[]; // preferred base spirits (category names)
  flavors: string[]; // flavor affinities
  sweetness: "dry" | "balanced" | "sweet" | "";
  strength: "sessionable" | "balanced" | "spirit-forward" | "";
  adventure: "classics" | "mix" | "experimental" | "";
  avoid: string; // free text — dislikes, allergies
  notes: string; // free text — anything else worth remembering
};

export const EMPTY_PROFILE: TasteProfile = {
  spirits: [],
  flavors: [],
  sweetness: "",
  strength: "",
  adventure: "",
  avoid: "",
  notes: "",
};

// Questionnaire definitions rendered by the profile editor.
export const FLAVOR_OPTIONS = [
  "Smoky / Peaty",
  "Bitter",
  "Sweet",
  "Citrus",
  "Herbal / Botanical",
  "Spiced",
  "Fruity",
  "Rich / Boozy",
  "Bright / Refreshing",
  "Dry / Mineral",
];

export const SWEETNESS_OPTIONS: { value: TasteProfile["sweetness"]; label: string }[] = [
  { value: "dry", label: "Dry" },
  { value: "balanced", label: "Balanced" },
  { value: "sweet", label: "Sweet" },
];

export const STRENGTH_OPTIONS: { value: TasteProfile["strength"]; label: string }[] = [
  { value: "sessionable", label: "Light & sessionable" },
  { value: "balanced", label: "Balanced" },
  { value: "spirit-forward", label: "Spirit-forward" },
];

export const ADVENTURE_OPTIONS: { value: TasteProfile["adventure"]; label: string }[] = [
  { value: "classics", label: "Stick to classics" },
  { value: "mix", label: "A mix" },
  { value: "experimental", label: "Surprise me" },
];

export function profileIsEmpty(p: TasteProfile): boolean {
  return (
    p.spirits.length === 0 &&
    p.flavors.length === 0 &&
    !p.sweetness &&
    !p.strength &&
    !p.adventure &&
    !p.avoid.trim() &&
    !p.notes.trim()
  );
}
