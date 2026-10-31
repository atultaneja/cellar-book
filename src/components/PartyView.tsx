"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { COCKTAILS, makeable } from "@/lib/cocktails";
import { tokensFor } from "@/lib/categories";
import { inStock } from "@/lib/levels";
import { decodeCustom, encodeCustom, isCustomId } from "@/lib/customCocktail";
import type { Bottle, Party } from "@/lib/types";

export function PartyView({
  initialParty,
  bottles,
  initialOpenBottleIds,
  initialCocktailIds,
  contributions,
}: {
  initialParty: Party | null;
  bottles: Bottle[];
  initialOpenBottleIds: string[];
  initialCocktailIds: string[];
  contributions: { guest_name: string; item: string }[];
}) {
  const supabase = createClient();
  const [party, setParty] = useState<Party | null>(initialParty);
  const [openBottles, setOpenBottles] = useState<Set<string>>(new Set(initialOpenBottleIds));
  const [cocktails, setCocktails] = useState<Set<string>>(new Set(initialCocktailIds));
  const [name, setName] = useState("This Evening");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [bottleQuery, setBottleQuery] = useState("");

  // Host-defined cocktails (anything not in the built-in canon), decoded from
  // their stored ids so we can show name + description and remove them.
  const customCocktails = useMemo(
    () =>
      Array.from(cocktails)
        .filter(isCustomId)
        .map((id) => ({ cocktailId: id, data: decodeCustom(id) }))
        .filter((c): c is { cocktailId: string; data: NonNullable<ReturnType<typeof decodeCustom>> } =>
          c.data !== null
        ),
    [cocktails]
  );

  const stocked = useMemo(() => bottles.filter((b) => inStock(b.level)), [bottles]);

  // Bottles currently marked open — shown as an at-a-glance summary.
  const openList = useMemo(
    () => stocked.filter((b) => openBottles.has(b.id)),
    [stocked, openBottles]
  );

  // The pickable list, filtered by the search box (name / brand / category).
  const filteredStocked = useMemo(() => {
    const q = bottleQuery.trim().toLowerCase();
    if (!q) return stocked;
    return stocked.filter((b) =>
      `${b.name} ${b.brand ?? ""} ${b.category}`.toLowerCase().includes(q)
    );
  }, [stocked, bottleQuery]);

  const availableCats = useMemo(() => {
    const s = new Set<string>();
    for (const b of stocked) tokensFor(b.category).forEach((t) => s.add(t));
    return s;
  }, [stocked]);

  const suggestedCocktails = useMemo(
    () => COCKTAILS.filter((c) => makeable(c, availableCats)),
    [availableCats]
  );

  const shareUrl =
    party && typeof window !== "undefined" ? `${window.location.origin}/p/${party.token}` : "";

  async function createParty() {
    setBusy(true);
    const { data, error } = await supabase
      .from("parties")
      .insert({ name: name.trim() || "This Evening", active: true })
      .select()
      .single();
    setBusy(false);
    if (!error && data) setParty(data as Party);
  }

  async function toggleBottle(id: string) {
    if (!party) return;
    const has = openBottles.has(id);
    const next = new Set(openBottles);
    has ? next.delete(id) : next.add(id);
    setOpenBottles(next);
    if (has) {
      await supabase
        .from("party_bottles")
        .delete()
        .eq("party_id", party.id)
        .eq("bottle_id", id);
    } else {
      await supabase.from("party_bottles").insert({ party_id: party.id, bottle_id: id });
    }
  }

  async function toggleCocktail(id: string) {
    if (!party) return;
    const has = cocktails.has(id);
    const next = new Set(cocktails);
    has ? next.delete(id) : next.add(id);
    setCocktails(next);
    if (has) {
      await supabase
        .from("party_cocktails")
        .delete()
        .eq("party_id", party.id)
        .eq("cocktail_id", id);
    } else {
      await supabase.from("party_cocktails").insert({ party_id: party.id, cocktail_id: id });
    }
  }

  async function addCustomCocktail() {
    if (!party) return;
    const n = customName.trim();
    if (!n) return;
    const id = encodeCustom(n, customDesc);
    const next = new Set(cocktails);
    next.add(id);
    setCocktails(next);
    setCustomName("");
    setCustomDesc("");
    await supabase.from("party_cocktails").insert({ party_id: party.id, cocktail_id: id });
  }

  async function removeCocktailId(id: string) {
    if (!party) return;
    const next = new Set(cocktails);
    next.delete(id);
    setCocktails(next);
    await supabase
      .from("party_cocktails")
      .delete()
      .eq("party_id", party.id)
      .eq("cocktail_id", id);
  }

  async function endParty() {
    if (!party) return;
    if (!confirm("End this party? The share link will stop working.")) return;
    await supabase.from("parties").update({ active: false }).eq("id", party.id);
    setParty(null);
    setOpenBottles(new Set());
    setCocktails(new Set());
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  // ---------- No active party ----------
  if (!party || !party.active) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-racing">Host an Evening</h1>
        <p className="mb-5 font-body text-sm text-ink-soft">
          Open the bar for guests. Mark what&rsquo;s pouring, share a link — no login for them.
        </p>
        <div className="club-card p-5">
          <label className="club-label">Name this evening</label>
          <input
            className="club-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Saturday at the Club"
          />
          <button className="club-btn mt-4 w-full" disabled={busy} onClick={createParty}>
            {busy ? "Setting the table…" : "Open the bar"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Active party ----------
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-racing">{party.name}</h1>
          <p className="font-body text-sm text-ink-soft">The bar is open.</p>
        </div>
        <button className="club-btn-ghost !border-oxblood/40 !text-oxblood !py-1.5 text-xs" onClick={endParty}>
          End party
        </button>
      </div>

      {/* Share card */}
      <div className="club-card mb-6 p-4">
        <label className="club-label">Guest link</label>
        <div className="flex gap-2">
          <input className="club-input font-mono text-xs" readOnly value={shareUrl} />
          <button className="club-btn shrink-0" onClick={copyLink}>
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        <p className="mt-2 font-body text-xs text-ink-soft">
          Share this with guests. They see tonight&rsquo;s bottles and cocktails, and can add
          what they&rsquo;re bringing.
        </p>
      </div>

      {/* What guests are bringing (read-only) */}
      {contributions.length > 0 && (
        <section className="mb-6">
          <SectionHead label={`Guests are bringing (${contributions.length})`} />
          <div className="club-card divide-y divide-brass/20">
            {contributions.map((c, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                <span className="font-body text-ink">{c.item}</span>
                <span className="font-body text-xs text-ink-soft">{c.guest_name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cocktails on offer */}
      <section className="mb-6">
        <SectionHead label={`Cocktails on offer (${cocktails.size})`} />
        <div className="flex flex-wrap gap-2">
          {suggestedCocktails.map((c) => {
            const on = cocktails.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleCocktail(c.id)}
                className={`club-chip ${
                  on
                    ? "border-racing bg-racing text-parchment"
                    : "border-brass/40 text-ink-soft hover:bg-brass/10"
                }`}
              >
                {on ? "✓ " : ""}
                {c.name}
              </button>
            );
          })}
          {suggestedCocktails.length === 0 && (
            <p className="font-body text-sm italic text-ink-soft">
              No complete cocktails from current stock — add your own below or pick open bottles.
            </p>
          )}
        </div>

        {/* Host-added cocktails */}
        {customCocktails.length > 0 && (
          <div className="mt-3 club-card divide-y divide-brass/20">
            {customCocktails.map(({ cocktailId, data }) => (
              <div key={cocktailId} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="font-body font-semibold text-ink">{data.name}</div>
                  {data.description && (
                    <div className="font-body text-sm text-ink-soft">{data.description}</div>
                  )}
                </div>
                <button
                  onClick={() => removeCocktailId(cocktailId)}
                  aria-label={`Remove ${data.name}`}
                  className="shrink-0 font-body text-xs font-semibold text-oxblood hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add any cocktail */}
        <div className="mt-3 club-card p-4">
          <label className="club-label">Add any cocktail</label>
          <input
            className="club-input"
            placeholder="Cocktail name — e.g. Bloody Mary"
            value={customName}
            maxLength={80}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCustomCocktail();
            }}
          />
          <textarea
            className="club-input mt-2 min-h-[64px] resize-y"
            placeholder="Brief description (optional) — e.g. Vodka, tomato juice, lemon & spices, served tall"
            value={customDesc}
            maxLength={280}
            onChange={(e) => setCustomDesc(e.target.value)}
          />
          <button
            className="club-btn mt-3 w-full"
            disabled={!customName.trim()}
            onClick={addCustomCocktail}
          >
            Add to the menu
          </button>
        </div>
      </section>

      {/* What's open right now — at a glance */}
      <section className="mb-6">
        <SectionHead label={`Open at the bar (${openBottles.size})`} />
        {openList.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {openList.map((b) => (
              <button
                key={b.id}
                onClick={() => toggleBottle(b.id)}
                title="Tap to close"
                className="club-chip border-racing bg-racing text-parchment"
              >
                {b.name}
                <span className="ml-1.5 opacity-70">✕</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="font-body text-sm italic text-ink-soft">
            Nothing open yet — pick bottles below.
          </p>
        )}
      </section>

      {/* Pick bottles to open */}
      <section>
        <SectionHead label="Add bottles" />
        <input
          className="club-input mb-2"
          placeholder="Search your cellar — name, brand or category"
          value={bottleQuery}
          onChange={(e) => setBottleQuery(e.target.value)}
        />
        <div className="club-card divide-y divide-brass/20">
          {filteredStocked.map((b) => {
            const on = openBottles.has(b.id);
            return (
              <button
                key={b.id}
                onClick={() => toggleBottle(b.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brass/5"
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${
                    on ? "border-racing bg-racing text-parchment" : "border-brass/50"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body font-semibold text-ink">{b.name}</span>
                  <span className="block truncate font-body text-xs text-ink-soft">
                    {b.brand ? `${b.brand} · ` : ""}
                    {b.category}
                  </span>
                </span>
              </button>
            );
          })}
          {stocked.length === 0 && (
            <p className="px-4 py-6 text-center font-body text-sm italic text-ink-soft">
              No bottles in stock to open. Fill the cellar first.
            </p>
          )}
          {stocked.length > 0 && filteredStocked.length === 0 && (
            <p className="px-4 py-6 text-center font-body text-sm italic text-ink-soft">
              No bottles match &ldquo;{bottleQuery}&rdquo;.
            </p>
          )}
        </div>
      </section>
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
