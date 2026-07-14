"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, FAMILIES, familyOf } from "@/lib/categories";
import { inStock, mlForLevel, levelForMl } from "@/lib/levels";
import { SIZE_OPTIONS, DEFAULT_SIZE, sizeToMl } from "@/lib/sizes";
import type { Bottle } from "@/lib/types";
import { CategorySelect } from "./CategorySelect";
import { LevelPicker } from "./LevelPicker";
import { PhotoScan } from "./PhotoScan";
import { PourControl } from "./PourControl";

type Draft = { name: string; brand: string; category: string; size: string; level: number };

const EMPTY_DRAFT: Draft = {
  name: "",
  brand: "",
  category: "Other",
  size: DEFAULT_SIZE,
  level: 5,
};

export function CellarView({
  initial,
  aiEnabled,
  isAdmin,
}: {
  initial: Bottle[];
  aiEnabled: boolean;
  isAdmin: boolean;
}) {
  const supabase = createClient();
  const [bottles, setBottles] = useState<Bottle[]>(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [mode, setMode] = useState<"none" | "single" | "bulk" | "scan">("none");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const inStockCount = bottles.filter((b) => inStock(b.level)).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bottles.filter((b) => {
      const matchesQ =
        !q ||
        b.name.toLowerCase().includes(q) ||
        (b.brand ?? "").toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q);
      const matchesC = filter === "All" || familyOf(b.category) === filter;
      return matchesQ && matchesC;
    });
  }, [bottles, query, filter]);

  // Group by family (Whiskey, Gin, Wine, …), and within each family by the
  // specific category (Bourbon, Indian Single Malt, …).
  const grouped = useMemo(() => {
    const fam = new Map<string, Map<string, Bottle[]>>();
    for (const b of filtered) {
      const f = familyOf(b.category);
      if (!fam.has(f)) fam.set(f, new Map());
      const cats = fam.get(f)!;
      if (!cats.has(b.category)) cats.set(b.category, []);
      cats.get(b.category)!.push(b);
    }
    return FAMILIES.filter((f) => fam.has(f)).map((f) => {
      const cats = fam.get(f)!;
      const categories = Array.from(cats.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([category, list]) => ({
          category,
          bottles: [...list].sort((x, y) => x.name.localeCompare(y.name)),
        }));
      const count = categories.reduce((n, c) => n + c.bottles.length, 0);
      return { family: f, count, categories };
    });
  }, [filtered]);

  async function addSingle() {
    if (!draft.name.trim()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("bottles")
      .insert({
        name: draft.name.trim(),
        brand: draft.brand.trim() || null,
        category: draft.category,
        size: draft.size,
        level: draft.level,
      })
      .select()
      .single();
    setBusy(false);
    if (!error && data) {
      setBottles((prev) => [...prev, data as Bottle]);
      setDraft(EMPTY_DRAFT);
    }
  }

  async function addBulk() {
    const rows = bulk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        // Format: Name | Category   (category optional)
        const [name, category] = line.split("|").map((s) => s.trim());
        const cat = CATEGORIES.includes((category as never) ?? "") ? category : "Other";
        return { name, brand: null, category: cat, level: 5 };
      })
      .filter((r) => r.name);
    if (rows.length === 0) return;
    setBusy(true);
    const { data, error } = await supabase.from("bottles").insert(rows).select();
    setBusy(false);
    if (!error && data) {
      setBottles((prev) => [...prev, ...(data as Bottle[])]);
      setBulk("");
      setMode("none");
    }
  }

  async function addMany(
    rows: { name: string; brand: string | null; category: string; size: string; level: number }[]
  ) {
    if (rows.length === 0) return;
    const { data, error } = await supabase.from("bottles").insert(rows).select();
    if (!error && data) setBottles((prev) => [...prev, ...(data as Bottle[])]);
  }

  async function setLevel(id: string, level: number) {
    // Manually setting a level reconciles the fine-grained ml estimate.
    const b = bottles.find((x) => x.id === id);
    const sizeMl = b ? sizeToMl(b.size) : null;
    const patch: Partial<Bottle> =
      sizeMl != null ? { level, remaining_ml: mlForLevel(level, sizeMl) } : { level };
    setBottles((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    await supabase.from("bottles").update(patch).eq("id", id);
  }

  // Record a pour: log it (for the dashboard) and, when size is known,
  // subtract the volume and re-estimate the coarse level.
  async function logPour(bottle: Bottle, ml: number) {
    const sizeMl = sizeToMl(bottle.size);
    if (sizeMl != null) {
      const currentMl = bottle.remaining_ml ?? mlForLevel(bottle.level, sizeMl);
      const newMl = Math.max(0, currentMl - ml);
      const newLevel = levelForMl(newMl, sizeMl);
      setBottles((prev) =>
        prev.map((x) => (x.id === bottle.id ? { ...x, remaining_ml: newMl, level: newLevel } : x))
      );
      await supabase
        .from("bottles")
        .update({ remaining_ml: newMl, level: newLevel })
        .eq("id", bottle.id);
    }
    await supabase.from("drink_log").insert({
      bottle_id: bottle.id,
      bottle_name: bottle.name,
      category: bottle.category,
      volume_ml: ml,
    });
  }

  async function saveEdit(id: string, patch: Partial<Bottle>) {
    setBottles((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    setEditing(null);
    await supabase.from("bottles").update(patch).eq("id", id);
  }

  async function remove(id: string) {
    setBottles((prev) => prev.filter((b) => b.id !== id));
    await supabase.from("bottles").delete().eq("id", id);
  }

  return (
    <div>
      {/* Summary */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-racing">The Cellar</h1>
          <p className="font-body text-sm text-ink-soft">
            {bottles.length} bottles catalogued · {inStockCount} in good supply
          </p>
        </div>
      </div>

      {/* Controls — admin only */}
      {isAdmin && (
        <div className={`mb-4 grid gap-2 ${aiEnabled ? "grid-cols-3" : "grid-cols-2"}`}>
          {aiEnabled && (
            <button
              className={mode === "scan" ? "club-btn" : "club-btn-ghost"}
              onClick={() => setMode(mode === "scan" ? "none" : "scan")}
            >
              📷 Scan
            </button>
          )}
          <button
            className={mode === "single" ? "club-btn" : "club-btn-ghost"}
            onClick={() => setMode(mode === "single" ? "none" : "single")}
          >
            + Add
          </button>
          <button
            className={mode === "bulk" ? "club-btn" : "club-btn-ghost"}
            onClick={() => setMode(mode === "bulk" ? "none" : "bulk")}
          >
            Bulk
          </button>
        </div>
      )}

      {isAdmin && aiEnabled && mode === "scan" && (
        <PhotoScan onAdd={addMany} onDone={() => setMode("none")} />
      )}

      {mode === "single" && (
        <div className="club-card mb-4 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="club-label">Name / expression</label>
              <input
                className="club-input"
                placeholder="Glenfiddich 12"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div>
              <label className="club-label">Brand / distiller (optional)</label>
              <input
                className="club-input"
                placeholder="William Grant & Sons"
                value={draft.brand}
                onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
              />
            </div>
            <div>
              <label className="club-label">Category</label>
              <CategorySelect
                value={draft.category}
                onChange={(v) => setDraft({ ...draft, category: v })}
              />
            </div>
            <div>
              <label className="club-label">Bottle size</label>
              <select
                className="club-input"
                value={draft.size}
                onChange={(e) => setDraft({ ...draft, size: e.target.value })}
              >
                {SIZE_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="club-btn mt-3 w-full" disabled={busy} onClick={addSingle}>
            {busy ? "Saving…" : "Add to cellar"}
          </button>
        </div>
      )}

      {mode === "bulk" && (
        <div className="club-card mb-4 p-4">
          <label className="club-label">One bottle per line</label>
          <p className="mb-2 font-body text-xs text-ink-soft">
            Format: <span className="font-semibold">Name | Category</span>. Category is optional.
            <br />e.g. <em>Tanqueray No. Ten | Gin</em>
          </p>
          <textarea
            className="club-input h-40 resize-y font-mono text-sm"
            placeholder={"Tanqueray No. Ten | Gin\nLagavulin 16 | Scotch\nCampari | Campari / Bitter Aperitivo"}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
          />
          <button className="club-btn mt-3 w-full" disabled={busy} onClick={addBulk}>
            {busy ? "Adding…" : "Add all"}
          </button>
        </div>
      )}

      {/* Search + filter */}
      <div className="mb-4 flex gap-2">
        <input
          className="club-input"
          placeholder="Search the cellar…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="club-input w-44"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option>All</option>
          {FAMILIES.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {bottles.length === 0 ? (
        <div className="club-card p-8 text-center">
          <p className="font-display text-lg text-racing">The cellar awaits its first entry.</p>
          <p className="mt-1 font-body text-sm text-ink-soft">
            Use <span className="font-semibold">Bulk add</span> to load your collection quickly.
          </p>
        </div>
      ) : (
        grouped.map((g) => (
          <section key={g.family} className="mb-5">
            <div className="mb-2 flex items-center gap-3">
              <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-racing">
                {g.family}
              </h2>
              <span className="font-body text-xs text-ink-soft">{g.count}</span>
              <div className="club-rule flex-1" />
            </div>
            <div className="club-card divide-y divide-brass/20">
              {g.categories.map((cat) => (
                <div key={cat.category}>
                  {g.categories.length > 1 && (
                    <div className="bg-brass/5 px-4 py-1.5 font-body text-[11px] font-semibold uppercase tracking-widest text-brass-dark">
                      {cat.category}
                    </div>
                  )}
                  <div className="divide-y divide-brass/10">
                    {cat.bottles.map((b) => (
                      <div key={b.id} className="px-4 py-3">
                        {editing === b.id ? (
                          <EditRow
                            bottle={b}
                            onSave={saveEdit}
                            onCancel={() => setEditing(null)}
                            onDelete={remove}
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-body font-semibold text-ink">
                                {b.name}
                              </div>
                              <div className="truncate font-body text-xs text-ink-soft">
                                {b.category}
                                {b.size && b.size !== "Unknown" ? ` · ${b.size}` : ""}
                                {b.brand ? ` · ${b.brand}` : ""}
                              </div>
                            </div>
                            <LevelPicker
                              level={b.level}
                              onChange={(lv) => setLevel(b.id, lv)}
                              readOnly={!isAdmin}
                            />
                            {isAdmin && <PourControl onPour={(ml) => logPour(b, ml)} />}
                            {isAdmin && (
                              <button
                                onClick={() => setEditing(b.id)}
                                className="font-body text-xs text-ink-soft underline decoration-brass/50 hover:text-racing"
                              >
                                edit
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function EditRow({
  bottle,
  onSave,
  onCancel,
  onDelete,
}: {
  bottle: Bottle;
  onSave: (id: string, patch: Partial<Bottle>) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(bottle.name);
  const [brand, setBrand] = useState(bottle.brand ?? "");
  const [category, setCategory] = useState(bottle.category);
  const [size, setSize] = useState(bottle.size ?? DEFAULT_SIZE);

  return (
    <div className="grid grid-cols-1 gap-2">
      <input className="club-input" value={name} onChange={(e) => setName(e.target.value)} />
      <input
        className="club-input"
        placeholder="Brand (optional)"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
      />
      <CategorySelect value={category} onChange={setCategory} />
      <select className="club-input" value={size} onChange={(e) => setSize(e.target.value)}>
        {SIZE_OPTIONS.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          className="club-btn flex-1"
          onClick={() =>
            onSave(bottle.id, { name: name.trim(), brand: brand.trim() || null, category, size })
          }
        >
          Save
        </button>
        <button className="club-btn-ghost flex-1" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="club-btn-ghost !border-oxblood/40 !text-oxblood"
          onClick={() => {
            if (confirm(`Remove ${bottle.name} from the cellar?`)) onDelete(bottle.id);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
