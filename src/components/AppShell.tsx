"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Crest } from "./Crest";
import { createClient } from "@/lib/supabase/client";

const ALL_TABS = [
  { href: "/home", label: "Home", adminOnly: false },
  { href: "/cellar", label: "Cellar", adminOnly: false },
  { href: "/restock", label: "Restock", adminOnly: false },
  { href: "/recommendations", label: "Recs", adminOnly: false },
  { href: "/party", label: "Party", adminOnly: true },
];

export function AppShell({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const tabs = ALL_TABS.filter((t) => isAdmin || !t.adminOnly);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-24">
      <header className="pt-6">
        <div className="flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-3">
            <Crest size={40} />
            <div className="leading-tight">
              <div className="font-display text-xl font-bold text-racing">Tantaan Tiki Bar</div>
              <div className="font-body text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                Good friends · good times
              </div>
            </div>
          </Link>
          <button onClick={signOut} className="club-btn-ghost !px-3 !py-1.5 text-xs">
            Sign out
          </button>
        </div>
        <div className="club-rule mt-4" />
      </header>

      <main className="flex-1 pt-6">{children}</main>

      {/* Bottom nav — thumb-friendly on mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-brass/30 bg-racing-deep/95 backdrop-blur">
        <div
          className="mx-auto grid max-w-3xl"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((t) => {
            const active = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-3 text-center font-body text-sm tracking-wide transition-colors ${
                  active
                    ? "bg-brass/20 font-bold text-brass-light"
                    : "text-parchment/60 hover:bg-white/5 hover:text-parchment"
                }`}
              >
                {active && <span className="absolute inset-x-0 top-0 h-[3px] bg-brass" />}
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
