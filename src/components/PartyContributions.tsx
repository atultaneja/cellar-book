"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Contribution = { guest_name: string; item: string };

// Shown on the public guest page — guests add what they're bringing.
export function PartyContributions({
  token,
  initial,
}: {
  token: string;
  initial: Contribution[];
}) {
  const [list, setList] = useState<Contribution[]>(initial);
  const [name, setName] = useState("");
  const [item, setItem] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !item.trim()) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("add_party_contribution", {
      p_token: token,
      p_guest: name,
      p_item: item,
    });
    setBusy(false);
    if (error) {
      setError("Couldn't add that — please try again.");
      return;
    }
    setList((prev) => [...prev, { guest_name: name.trim(), item: item.trim() }]);
    setName("");
    setItem("");
  }

  return (
    <section className="w-full">
      <h2 className="mb-3 text-center font-display text-sm font-semibold uppercase tracking-widest text-racing">
        Guests are bringing
      </h2>

      {list.length > 0 && (
        <div className="club-card mb-3 divide-y divide-brass/20">
          {list.map((c, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
              <span className="font-body text-ink">{c.item}</span>
              <span className="font-body text-xs text-ink-soft">{c.guest_name}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={add} className="club-card p-4">
        <label className="club-label">Bringing something? Add it here</label>
        <input
          className="club-input mb-2"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="club-input"
          placeholder="e.g. a bottle of Malbec, or limes & soda"
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />
        <button type="submit" disabled={busy} className="club-btn mt-3 w-full">
          {busy ? "Adding…" : "Add to the list"}
        </button>
        {error && <p className="mt-2 font-body text-sm text-oxblood">{error}</p>}
      </form>
    </section>
  );
}
