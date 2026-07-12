"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ADVENTURE_OPTIONS,
  FLAVOR_OPTIONS,
  STRENGTH_OPTIONS,
  SWEETNESS_OPTIONS,
  type TasteProfile,
} from "@/lib/taste";

// Base spirits offered as preference toggles (a readable subset of categories).
const SPIRIT_OPTIONS = [
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
  "Campari / Bitter Aperitivo",
  "Amaro",
];

export function TasteProfileEditor({
  initial,
  onSaved,
  onClose,
}: {
  initial: TasteProfile;
  onSaved: (p: TasteProfile) => void;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [p, setP] = useState<TasteProfile>(initial);
  const [saving, setSaving] = useState(false);

  function toggle(key: "spirits" | "flavors", value: string) {
    setP((prev) => {
      const has = prev[key].includes(value);
      return { ...prev, [key]: has ? prev[key].filter((v) => v !== value) : [...prev[key], value] };
    });
  }

  async function save() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("taste_profiles")
        .upsert({ user_id: user.id, data: p, updated_at: new Date().toISOString() });
    }
    setSaving(false);
    onSaved(p);
  }

  return (
    <div className="club-card mb-5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-sm font-semibold uppercase tracking-widest text-racing">
          Your taste profile
        </span>
        <button className="font-body text-xs text-ink-soft underline" onClick={onClose}>
          close
        </button>
      </div>

      <ChipGroup
        label="Spirits you favour"
        options={SPIRIT_OPTIONS}
        selected={p.spirits}
        onToggle={(v) => toggle("spirits", v)}
      />
      <ChipGroup
        label="Flavours you enjoy"
        options={FLAVOR_OPTIONS}
        selected={p.flavors}
        onToggle={(v) => toggle("flavors", v)}
      />

      <RadioRow
        label="Sweetness"
        options={SWEETNESS_OPTIONS}
        value={p.sweetness}
        onChange={(v) => setP({ ...p, sweetness: v as TasteProfile["sweetness"] })}
      />
      <RadioRow
        label="Strength"
        options={STRENGTH_OPTIONS}
        value={p.strength}
        onChange={(v) => setP({ ...p, strength: v as TasteProfile["strength"] })}
      />
      <RadioRow
        label="Adventurousness"
        options={ADVENTURE_OPTIONS}
        value={p.adventure}
        onChange={(v) => setP({ ...p, adventure: v as TasteProfile["adventure"] })}
      />

      <div className="mt-3">
        <label className="club-label">Anything to avoid</label>
        <input
          className="club-input"
          placeholder="e.g. no anise, dislike overly sweet"
          value={p.avoid}
          onChange={(e) => setP({ ...p, avoid: e.target.value })}
        />
      </div>
      <div className="mt-3">
        <label className="club-label">Notes for the sommelier</label>
        <input
          className="club-input"
          placeholder="e.g. love a smoky nightcap, prefer stirred over shaken"
          value={p.notes}
          onChange={(e) => setP({ ...p, notes: e.target.value })}
        />
      </div>

      <button className="club-btn mt-4 w-full" disabled={saving} onClick={save}>
        {saving ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <label className="club-label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              onClick={() => onToggle(o)}
              className={`club-chip ${
                on ? "border-racing bg-racing text-parchment" : "border-brass/40 text-ink-soft"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RadioRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <label className="club-label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(value === o.value ? "" : o.value)}
            className={`club-chip ${
              value === o.value
                ? "border-racing bg-racing text-parchment"
                : "border-brass/40 text-ink-soft"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
