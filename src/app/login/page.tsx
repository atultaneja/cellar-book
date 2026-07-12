"use client";

import { useState } from "react";
import { Crest } from "@/components/Crest";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
      <Crest size={72} />
      <h1 className="mt-5 text-center font-display text-3xl font-bold text-racing">
        The Cellar Book
      </h1>
      <p className="mt-1 text-center font-body text-sm italic text-ink-soft">
        A gentleman&rsquo;s record of the home bar.
      </p>
      <div className="club-rule my-6" />

      {sent ? (
        <div className="club-card w-full p-6 text-center">
          <p className="font-body text-ink">
            A sign-in link is on its way to <span className="font-semibold">{email}</span>.
          </p>
          <p className="mt-2 font-body text-sm text-ink-soft">
            Open it on this device to enter the club.
          </p>
        </div>
      ) : (
        <form onSubmit={sendLink} className="club-card w-full p-6">
          <label htmlFor="email" className="club-label">
            Members&rsquo; email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="club-input"
          />
          <button type="submit" disabled={loading} className="club-btn mt-4 w-full">
            {loading ? "Sending…" : "Send me a sign-in link"}
          </button>
          {error && <p className="mt-3 font-body text-sm text-oxblood">{error}</p>}
          <p className="mt-4 font-body text-xs text-ink-soft">
            No password. We email you a one-time link.
          </p>
        </form>
      )}
    </div>
  );
}
