"use client";

import { useState } from "react";
import { LEVELS } from "@/lib/levels";
import { CategorySelect } from "./CategorySelect";

type Candidate = {
  name: string;
  brand: string | null;
  category: string;
  guessed_level: number | null;
  confidence: "high" | "medium" | "low";
  include: boolean;
  level: number;
};

// Downscale a photo to a max edge and return base64 JPEG (keeps upload small
// and cheap while remaining legible enough to read a label).
async function fileToScaledBase64(
  file: File,
  maxEdge = 1280
): Promise<{ media_type: string; data: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return { media_type: "image/jpeg", data: dataUrl.split(",")[1] };
}

export function PhotoScan({
  onAdd,
  onDone,
}: {
  onAdd: (bottles: { name: string; brand: string | null; category: string; level: number }[]) => Promise<void>;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const images = await Promise.all(
        Array.from(files).slice(0, 6).map((f) => fileToScaledBase64(f))
      );
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not read the photo");
      const found: Candidate[] = (json.bottles ?? []).map((b: Omit<Candidate, "include" | "level">) => ({
        ...b,
        include: true,
        level: b.guessed_level ?? 5,
      }));
      if (found.length === 0) setError("No bottles recognised — try a clearer, closer photo.");
      setCandidates(found);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function patch(i: number, p: Partial<Candidate>) {
    setCandidates((prev) => prev!.map((c, idx) => (idx === i ? { ...c, ...p } : c)));
  }

  async function saveSelected() {
    if (!candidates) return;
    const chosen = candidates.filter((c) => c.include && c.name.trim());
    if (chosen.length === 0) return;
    setSaving(true);
    await onAdd(
      chosen.map((c) => ({
        name: c.name.trim(),
        brand: c.brand?.trim() || null,
        category: c.category,
        level: c.level,
      }))
    );
    setSaving(false);
    onDone();
  }

  return (
    <div className="club-card mb-4 p-4">
      {!candidates && (
        <>
          <label className="club-label">Scan a bottle (or a whole shelf)</label>
          <p className="mb-3 font-body text-xs text-ink-soft">
            Take or upload up to 6 photos. We&rsquo;ll read the labels and identify each bottle;
            you confirm before anything is saved.
          </p>
          <label className="club-btn w-full cursor-pointer">
            {busy ? "Reading the labels…" : "📷 Take / choose photos"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              disabled={busy}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
          {error && <p className="mt-3 font-body text-sm text-oxblood">{error}</p>}
        </>
      )}

      {candidates && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-sm font-semibold uppercase tracking-widest text-racing">
              Confirm what we found
            </span>
            <button
              className="font-body text-xs text-ink-soft underline"
              onClick={() => {
                setCandidates(null);
                setError(null);
              }}
            >
              rescan
            </button>
          </div>
          {error && <p className="mb-2 font-body text-sm text-oxblood">{error}</p>}
          <div className="space-y-3">
            {candidates.map((c, i) => (
              <div
                key={i}
                className={`rounded-md border p-3 ${
                  c.include ? "border-brass/40 bg-parchment" : "border-brass/20 opacity-50"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 font-body text-sm">
                    <input
                      type="checkbox"
                      checked={c.include}
                      onChange={(e) => patch(i, { include: e.target.checked })}
                    />
                    include
                  </label>
                  <span className="font-body text-[11px] uppercase tracking-widest text-brass-dark">
                    {c.confidence} confidence
                  </span>
                </div>
                <input
                  className="club-input mb-2"
                  value={c.name}
                  onChange={(e) => patch(i, { name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <CategorySelect
                    value={c.category}
                    onChange={(v) => patch(i, { category: v })}
                  />
                  <select
                    className="club-input"
                    value={c.level}
                    onChange={(e) => patch(i, { level: Number(e.target.value) })}
                  >
                    {LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button className="club-btn flex-1" disabled={saving} onClick={saveSelected}>
              {saving ? "Adding…" : "Add selected to cellar"}
            </button>
            <button className="club-btn-ghost" onClick={onDone}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
