"use client";

import { useMemo, useState } from "react";
import { COCKTAILS, NEAT_POURS, makeable, missingCount, type Mood } from "@/lib/cocktails";
import { inStock } from "@/lib/levels";
import { profileIsEmpty, type TasteProfile } from "@/lib/taste";
import type { Bottle } from "@/lib/types";
import { Sommelier } from "./Sommelier";
import { TasteProfileEditor } from "./TasteProfileEditor";

const MOODS: (Mood | "All")[] = [
  "All",
  "Aperitif",
  "Celebratory",
  "Summer",
  "Contemplative",
  "Nightcap",
  "Crowd-pleaser",
];

export function RecommendationsView({
  bottles,
  initialProfile,
  aiEnabled,
}: {
  bottles: Bottle[];
  initialProfile: TasteProfile;
  aiEnabled: boolean;
}) {
  const [mood, setMood] = useState<Mood | "All">("All");
  const [profile, setProfile] = useState<TasteProfile>(initialProfile);
  const [editingProfile, setEditingProfile] = useState(false);

  const available = useMemo(() => {
    const s = new Set<string>();
    for (const b of bottles) if (inStock(b.level)) s.add(b.category);
    return s;
  }, [bottles]);

  const canMake = useMemo(
    () =>
      COCKTAILS.filter((c) => makeable(c, available)).filter(
        (c) => mood === "All" || c.moods.includes(mood)
      ),
    [available, mood]
  );

  const oneShort = useMemo(
    () =>
      COCKTAILS.filter((c) => missingCount(c, available) === 1).map((c) => ({
        cocktail: c,
        missing: c.requires.filter((r) => !available.has(r)),
      })),
    [available]
  );

  const pours = useMemo(
    () =>
      Object.entries(NEAT_POURS)
        .filter(([cat]) => available.has(cat))
        .filter(([, v]) => mood === "All" || v.mood === mood),
    [available, mood]
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-racing">The Recommendation</h1>
      <p className="mb-4 font-body text-sm text-ink-soft">
        Drawn entirely from what stands in good supply tonight.
      </p>

      {/* AI section — only when a Claude key is configured */}
      {aiEnabled && (
        <>
          {/* Taste profile (memory) */}
          {editingProfile ? (
            <TasteProfileEditor
              initial={profile}
              onSaved={(p) => {
                setProfile(p);
                setEditingProfile(false);
              }}
              onClose={() => setEditingProfile(false)}
            />
          ) : (
            <div className="club-card mb-5 flex items-center justify-between gap-3 p-3">
              <p className="font-body text-sm text-ink-soft">
                {profileIsEmpty(profile)
                  ? "Set your taste profile so the sommelier knows your palate."
                  : "The sommelier remembers your palate."}
              </p>
              <button
                className="club-btn-ghost !py-1.5 text-xs"
                onClick={() => setEditingProfile(true)}
              >
                {profileIsEmpty(profile) ? "Set profile" : "Edit"}
              </button>
            </div>
          )}

          {/* Interactive AI sommelier */}
          <Sommelier />

          {/* Divider before the rule-based picks */}
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-racing">
              Straight from your cellar
            </h2>
            <div className="club-rule flex-1" />
          </div>
        </>
      )}

      {/* Mood filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m}
            onClick={() => setMood(m)}
            className={`club-chip ${
              mood === m
                ? "border-racing bg-racing text-parchment"
                : "border-brass/40 text-ink-soft hover:bg-brass/10"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {available.size === 0 && (
        <div className="club-card mb-6 p-6 text-center">
          <p className="font-body text-ink-soft">
            Add a few bottles to the cellar and the suggestions will pour in.
          </p>
        </div>
      )}

      {/* Cocktails you can make */}
      <section className="mb-7">
        <SectionHead label={`Cocktails you can make (${canMake.length})`} />
        {canMake.length === 0 ? (
          <p className="font-body text-sm italic text-ink-soft">
            Nothing complete for this mood — try another, or see &ldquo;one bottle short&rdquo; below.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {canMake.map((c) => (
              <div key={c.id} className="club-card p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-racing">{c.name}</h3>
                  <span className="font-body text-[11px] uppercase tracking-widest text-brass-dark">
                    {c.moods[0]}
                  </span>
                </div>
                <p className="mt-1 font-body text-sm text-ink">{c.method}</p>
                <p className="mt-2 font-body text-xs text-ink-soft">
                  Pantry: {c.pantry.join(", ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Neat pours */}
      {pours.length > 0 && (
        <section className="mb-7">
          <SectionHead label="A considered neat pour" />
          <div className="club-card divide-y divide-brass/20">
            {pours.map(([cat, v]) => (
              <div key={cat} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-body font-semibold text-ink">{cat}</span>
                  <span className="font-body text-[11px] uppercase tracking-widest text-brass-dark">
                    {v.mood}
                  </span>
                </div>
                <p className="font-body text-sm text-ink-soft">{v.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* One bottle short */}
      {oneShort.length > 0 && (
        <section className="mb-4">
          <SectionHead label="One bottle short" />
          <p className="mb-2 font-body text-xs text-ink-soft">
            Acquire the missing bottle and these open up.
          </p>
          <div className="club-card divide-y divide-brass/20">
            {oneShort.map(({ cocktail, missing }) => (
              <div key={cocktail.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-body font-semibold text-ink">{cocktail.name}</span>
                <span className="club-chip border-oxblood/40 bg-oxblood/10 text-oxblood">
                  needs {missing.join(", ")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHead({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-racing">
        {label}
      </h2>
      <div className="club-rule flex-1" />
    </div>
  );
}
