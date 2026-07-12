import { Crest } from "@/components/Crest";
import { createClient } from "@/lib/supabase/server";
import { cocktailById } from "@/lib/cocktails";
import type { PublicParty } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PublicPartyPage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_party_by_token", { p_token: params.token });
  const party = data as PublicParty | null;

  if (!party) {
    return (
      <Frame>
        <Crest size={64} />
        <h1 className="mt-4 font-display text-2xl font-bold text-racing">The bar is closed</h1>
        <p className="mt-1 font-body text-ink-soft">This evening&rsquo;s link is no longer open.</p>
      </Frame>
    );
  }

  const offered = party.cocktails.map(cocktailById).filter(Boolean);

  // Group open bottles by category
  const byCat = new Map<string, PublicParty["bottles"]>();
  for (const b of party.bottles) {
    if (!byCat.has(b.category)) byCat.set(b.category, []);
    byCat.get(b.category)!.push(b);
  }

  return (
    <Frame>
      <Crest size={56} />
      <p className="mt-3 font-body text-[11px] uppercase tracking-[0.25em] text-brass-dark">
        You are most welcome at
      </p>
      <h1 className="mt-1 text-center font-display text-3xl font-bold text-racing">{party.name}</h1>
      <div className="club-rule my-6 w-full" />

      {offered.length > 0 && (
        <section className="mb-8 w-full">
          <h2 className="mb-3 text-center font-display text-sm font-semibold uppercase tracking-widest text-racing">
            Cocktail Menu
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {offered.map((c) => (
              <div key={c!.id} className="club-card p-4">
                <h3 className="font-display text-lg font-semibold text-racing">{c!.name}</h3>
                <p className="mt-1 font-body text-sm text-ink">{c!.method}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {party.bottles.length > 0 && (
        <section className="w-full">
          <h2 className="mb-3 text-center font-display text-sm font-semibold uppercase tracking-widest text-racing">
            Open at the Bar
          </h2>
          <div className="club-card divide-y divide-brass/20">
            {Array.from(byCat.entries()).map(([cat, items]) => (
              <div key={cat} className="px-4 py-3">
                <div className="font-body text-[11px] uppercase tracking-widest text-brass-dark">
                  {cat}
                </div>
                <ul className="mt-1">
                  {items.map((b, i) => (
                    <li key={i} className="font-body text-ink">
                      {b.name}
                      {b.brand ? <span className="text-ink-soft"> · {b.brand}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {offered.length === 0 && party.bottles.length === 0 && (
        <p className="font-body italic text-ink-soft">The host is still setting the table…</p>
      )}

      <p className="mt-10 font-body text-xs italic text-ink-soft">Poured from The Cellar Book</p>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center px-6 py-12">
      {children}
    </div>
  );
}
