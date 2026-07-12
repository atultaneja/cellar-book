"use client";

import { useState } from "react";
import { LEVELS, levelMeta } from "@/lib/levels";

function barColor(level: number) {
  if (level >= 4) return "bg-racing";
  if (level >= 2) return "bg-brass-dark";
  return "bg-oxblood";
}

export function LevelPicker({
  level,
  onChange,
  readOnly = false,
}: {
  level: number;
  onChange: (next: number) => void;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const meta = levelMeta(level);

  // Read-only viewers see the level bar but can't change it.
  if (readOnly) {
    return (
      <div className="flex w-24 items-center gap-2" title={meta.label}>
        <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-brass/20">
          <span
            className={`absolute inset-y-0 left-0 rounded-full ${barColor(level)}`}
            style={{ width: `${meta.pct}%` }}
          />
        </span>
        <span className="w-6 text-right font-body text-sm font-semibold text-ink">
          {meta.fraction}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-24 items-center gap-2"
        aria-label={`Level: ${meta.label}. Tap to change.`}
      >
        <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-brass/20">
          <span
            className={`absolute inset-y-0 left-0 rounded-full ${barColor(level)}`}
            style={{ width: `${meta.pct}%` }}
          />
        </span>
        <span className="w-6 text-right font-body text-sm font-semibold text-ink">
          {meta.fraction}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-md border border-brass/40 bg-parchment-card shadow-ledger">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => {
                  onChange(l.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left font-body text-sm hover:bg-brass/10 ${
                  l.value === level ? "bg-brass/15 font-semibold text-racing" : "text-ink"
                }`}
              >
                <span>{l.label}</span>
                <span className="text-ink-soft">{l.fraction}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
