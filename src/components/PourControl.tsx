"use client";

import { useState } from "react";

const PRESETS = [
  { label: "Single", ml: 30 },
  { label: "Double", ml: 60 },
  { label: "Cocktail", ml: 90 },
];

// A quick "log a pour" popover — presets plus a custom amount.
export function PourControl({ onPour }: { onPour: (ml: number) => void }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  function pour(ml: number) {
    if (ml > 0) onPour(ml);
    setOpen(false);
    setCustom("");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="font-body text-xs text-ink-soft underline decoration-brass/50 hover:text-racing"
        title="Log a pour"
      >
        pour
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-20 w-44 rounded-md border border-brass/40 bg-parchment-card p-2 shadow-ledger">
            <div className="mb-1 px-1 font-body text-[11px] uppercase tracking-widest text-brass-dark">
              Log a pour
            </div>
            {PRESETS.map((p) => (
              <button
                key={p.ml}
                onClick={() => pour(p.ml)}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left font-body text-sm hover:bg-brass/10"
              >
                <span>{p.label}</span>
                <span className="text-ink-soft">{p.ml} ml</span>
              </button>
            ))}
            <div className="mt-1 flex gap-1">
              <input
                type="number"
                inputMode="numeric"
                placeholder="ml"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="w-full rounded border border-brass/40 bg-parchment px-2 py-1 font-body text-sm outline-none"
              />
              <button
                onClick={() => pour(Number(custom))}
                className="rounded bg-racing px-2 py-1 font-body text-sm text-parchment"
              >
                Go
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
