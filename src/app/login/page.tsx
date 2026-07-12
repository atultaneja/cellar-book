"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crest } from "@/components/Crest";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/cellar");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
      <Crest size={72} />
      <h1 className="mt-5 text-center font-display text-3xl font-bold text-racing">
        Tantaan Tiki Bar
      </h1>
      <p className="mt-1 text-center font-body text-sm italic text-ink-soft">
        Karishma &amp; Atul&rsquo;s bar — good friends, good times.
      </p>
      <div className="club-rule my-6" />

      <form onSubmit={signIn} className="club-card w-full p-6">
        <label htmlFor="email" className="club-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="club-input"
        />
        <label htmlFor="password" className="club-label mt-4">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="club-input"
        />
        <button type="submit" disabled={loading} className="club-btn mt-5 w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        {error && <p className="mt-3 font-body text-sm text-oxblood">{error}</p>}
        <p className="mt-4 font-body text-xs text-ink-soft">
          Members only. Ask Atul for the guest login.
        </p>
      </form>
    </div>
  );
}
