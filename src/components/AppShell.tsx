"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Crest } from "./Crest";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { href: "/cellar", label: "Cellar" },
  { href: "/restock", label: "Restock" },
  { href: "/recommendations", label: "Recommend" },
  { href: "/party", label: "Party" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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
          <Link href="/cellar" className="flex items-center gap-3">
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
        <div className="mx-auto grid max-w-3xl grid-cols-4">
          {TABS.map((t) => {
            const active = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`py-3 text-center font-body text-sm tracking-wide transition-colors ${
                  active
                    ? "text-brass-light [text-shadow:0_0_1px_rgba(201,168,94,0.6)]"
                    : "text-parchment/70 hover:text-parchment"
                }`}
              >
                {t.label}
                <span
                  className={`mx-auto mt-1 block h-0.5 w-6 rounded-full ${
                    active ? "bg-brass" : "bg-transparent"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
