"use client";

import { useState } from "react";
import type { MaltAdvice, AcquirePick, WatchPick, Source } from "@/lib/malt";
import { MaltDashboard } from "./MaltDashboard";
import type { Overrides } from "@/lib/whisky";
import type { Bottle } from "@/lib/types";

const PRIORITY_LABEL: Record<AcquirePick["priority"], string> = {
  now: "Buy now",
  soon: "Buy soon",
  opportunistic: "If you spot it",
};

const PRIORITY_CLASS: Record<AcquirePick["priority"], string> = {
  now: "border-oxblood/40 bg-oxblood/10 text-oxblood",
  soon: "border-brass/50 bg-brass/10 text-brass-dark",
  opportunistic: "border-racing/30 bg-racing/10 text-racing",
};

export function MaltAdvisorView({
  aiEnabled,
  malts,
  overrides,
  initialAdvice,
  initialSources,
  lastUpdated,
}: {
  aiEnabled: boolean;
  malts: Bottle[];
  overrides: Overrides;
  initialAdvice: MaltAdvice | null;
  initialSources: Source[];
  lastUpdated: string | null;
}) {
  const maltCount = malts.length;
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<MaltAdvice | null>(initialAdvice);
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [stale, setStale] = useState<string | null>(lastUpdated);

  // Reads the response as text first, so a serverless timeout (which returns a
  // plain error page, not JSON) surfaces a friendly message instead of crashing.
  async function postJson<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    let json: (T & { error?: string }) | null = null;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new Error(
        res.status === 504 || /timed? ?out|error occurred/i.test(raw)
          ? "That step took too long — try a shorter, more specific request and run it again."
          : "The advisor is unavailable right now — please try again."
      );
    }
    if (!res.ok) throw new Error(json?.error || "The advisor is unavailable");
    return json as T;
  }

  // Two steps to stay under the 60s serverless budget: fast web research, then
  // the full Opus reasoning pass over those findings.
  async function build() {
    setLoading(true);
    setError(null);
    try {
      setPhase("Searching the latest releases…");
      const research = await postJson<{ findings: string; sources: Source[] }>(
        "/api/malt-advisor/research",
        { focus }
      );

      setPhase("Opus is thinking through your collection…");
      const plan = await postJson<{ advice: MaltAdvice; sources: Source[] }>(
        "/api/malt-advisor/plan",
        { focus, findings: research.findings, sources: research.sources }
      );

      setAdvice(plan.advice);
      setSources(plan.sources ?? research.sources ?? []);
      setStale(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setPhase("");
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-racing">Your Single Malts</h1>
      <p className="mb-4 font-body text-sm text-ink-soft">
        The collection at a glance — sliced by region, type, cask and age — with a strategic buyer
        on call below.
      </p>

      {/* The collection dashboard — always the default view */}
      <MaltDashboard malts={malts} initialOverrides={overrides} />

      {!aiEnabled ? (
        <div className="club-card p-6 text-center">
          <p className="font-body text-ink-soft">
            The advisor is turned off — no Claude key is configured.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-racing">
              Ask the Malt Advisor
            </h2>
            <div className="club-rule flex-1" />
          </div>

          <div className="club-card mb-5 p-4">
            <label className="club-label">
              What are you after? <span className="text-ink-soft">(optional)</span>
            </label>
            <input
              className="club-input"
              placeholder="e.g. budget ≤ ₹10k · fill my Islay gap · a special bottle for a birthday"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") build();
              }}
            />
            <button className="club-btn mt-3 w-full" disabled={loading} onClick={build}>
              {loading ? phase || "Working…" : "Build my acquisition plan"}
            </button>
            <p className="mt-2 font-body text-xs text-ink-soft">
              Reads your {maltCount} malt{maltCount === 1 ? "" : "s"} above, searches the latest
              releases, then reasons over it with Opus. Takes ~20–40 seconds.
            </p>
            {error && <p className="mt-3 font-body text-sm text-oxblood">{error}</p>}
          </div>

          {advice && (
            <div className="space-y-6">
              {stale && (
                <p className="font-body text-xs italic text-ink-soft">
                  Showing your last plan from {new Date(stale).toLocaleDateString()} — build a fresh
                  one for the newest releases.
                </p>
              )}

              {advice.assessment && (
                <section>
                  <SectionHead label="Where your collection stands" />
                  <div className="club-card p-4">
                    <p className="font-body text-sm text-ink">{advice.assessment}</p>
                    {advice.strategy && (
                      <p className="mt-3 font-body text-sm italic text-ink-soft">{advice.strategy}</p>
                    )}
                  </div>
                </section>
              )}

              {advice.acquire.length > 0 && (
                <section>
                  <SectionHead label="Acquire next" />
                  <div className="grid grid-cols-1 gap-3">
                    {advice.acquire.map((p, i) => (
                      <AcquireCard key={i} p={p} />
                    ))}
                  </div>
                </section>
              )}

              {advice.watch.length > 0 && (
                <section>
                  <SectionHead label="On your radar" />
                  <div className="club-card divide-y divide-brass/20">
                    {advice.watch.map((w, i) => (
                      <WatchRow key={i} w={w} />
                    ))}
                  </div>
                </section>
              )}

              {advice.note && (
                <section>
                  <SectionHead label="A word of caution" />
                  <div className="club-card border-oxblood/30 bg-oxblood/5 p-4">
                    <p className="font-body text-sm text-ink">{advice.note}</p>
                  </div>
                </section>
              )}

              {sources.length > 0 && (
                <section>
                  <SectionHead label="Sources" />
                  <div className="club-card divide-y divide-brass/20">
                    {sources.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 font-body text-sm text-racing underline decoration-brass/40 hover:bg-brass/5"
                      >
                        {s.title}
                      </a>
                    ))}
                  </div>
                  <p className="mt-2 font-body text-xs italic text-ink-soft">
                    Live web results the advisor consulted — verify price and availability before you
                    buy.
                  </p>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AcquireCard({ p }: { p: AcquirePick }) {
  return (
    <div className="club-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-racing">{p.name}</h3>
        <span className={`club-chip ${PRIORITY_CLASS[p.priority] ?? PRIORITY_CLASS.soon}`}>
          {PRIORITY_LABEL[p.priority] ?? "Buy soon"}
        </span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[11px] uppercase tracking-widest text-brass-dark">
        {p.distillery && <span>{p.distillery}</span>}
        {p.style && <span className="text-ink-soft">· {p.style}</span>}
        {p.approx_price && <span className="text-ink-soft">· {p.approx_price}</span>}
      </div>
      <p className="mt-2 font-body text-sm text-ink">{p.why}</p>
    </div>
  );
}

function WatchRow({ w }: { w: WatchPick }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-body font-semibold text-ink">{w.name}</span>
        {w.expected && (
          <span className="font-body text-[11px] uppercase tracking-widest text-brass-dark">
            {w.expected}
          </span>
        )}
      </div>
      {w.distillery && (
        <div className="font-body text-[11px] uppercase tracking-widest text-ink-soft">
          {w.distillery}
        </div>
      )}
      <p className="mt-1 font-body text-sm text-ink-soft">{w.why}</p>
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
