"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import { inStock } from "@/lib/levels";
import type { Bottle } from "@/lib/types";
import { LevelPicker } from "./LevelPicker";
import { PhotoScan } from "./PhotoScan";

type Draft = { name: string; brand: string; category: string; level: number };

const EMPTY_DRAFT: Draft = { name: "", brand: "", category: "Other", level: 5 };

export function CellarView({ initial }: { initial: Bottle[] }) {
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
      const matchesC = filter === "All" || b.category === filter;
      return matchesQ && matchesC;
    });
  }, [bottles, query, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Bottle[]>();
    for (const b of filtered) {
      if (!map.has(b.category)) map.set(b.category, []);
      map.get(b.category)!.push(b);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
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
    rows: { name: string; brand: string | null; category: string; level: number }[]
  ) {
    if (rows.length === 0) return;
    const { data, error } = await supabase.from("bottles").insert(rows).select();
    if (!error && data) setBottles((prev) => [...prev, ...(data as Bottle[])]);
  }

  async function setLevel(id: string, level: number) {
    setBottles((prev) => prev.map((b) => (b.id === id ? { ...b, level } : b)));
    await supabase.from("bottles").update({ level }).eq("id", id);
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

      {/* Controls */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <button
          className={mode === "scan" ? "club-btn" : "club-btn-ghost"}
          onClick={() => setMode(mode === "scan" ? "none" : "scan")}
        >
          📷 Scan
        </button>
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

      {mode === "scan" && <PhotoScan onAdd={addMany} onDone={() => setMode("none")} />}

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
              <select
                className="club-input"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
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
          className="club-input w-40"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option>All</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
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
        grouped.map(([category, items]) => (
          <section key={category} className="mb-5">
            <div className="mb-2 flex items-center gap-3">
              <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-racing">
                {category}
              </h2>
              <span className="font-body text-xs text-ink-soft">{items.length}</span>
              <div className="club-rule flex-1" />
            </div>
            <div className="club-card divide-y divide-brass/20">
              {items.map((b) => (
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
                        <div className="truncate font-body font-semibold text-ink">{b.name}</div>
                        {b.brand && (
                          <div className="truncate font-body text-xs text-ink-soft">{b.brand}</div>
                        )}
                      </div>
                      <LevelPicker level={b.level} onChange={(lv) => setLevel(b.id, lv)} />
                      <button
                        onClick={() => setEditing(b.id)}
                        className="font-body text-xs text-ink-soft underline decoration-brass/50 hover:text-racing"
                      >
                        edit
                      </button>
                    </div>
                  )}
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

  return (
    <div className="grid grid-cols-1 gap-2">
      <input className="club-input" value={name} onChange={(e) => setName(e.target.value)} />
      <input
        className="club-input"
        placeholder="Brand (optional)"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
      />
      <select
        className="club-input"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          className="club-btn flex-1"
          onClick={() => onSave(bottle.id, { name: name.trim(), brand: brand.trim() || null, category })}
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
