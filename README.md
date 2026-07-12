# Tantaan Tiki Bar

Karishma & Atul's home-bar inventory, restock, and recommendation app with a warm colonial /
club-house aesthetic. Mobile-first, cloud-synced, with a shareable guest "Party Mode".

## What it does
- **Cellar** — catalogue 100+ bottles with quick tap-levels (Full → Empty). Add by **photo scan** (Claude reads the labels), bulk paste, or by hand; search & filter by category.
- **Restock** — everything low or empty in one list; emailed to you automatically each Monday.
- **Recommend** — an AI **sommelier** tuned to your saved taste profile and current stock, plus deterministic picks (makeable cocktails, neat pours by mood, "one bottle short").
- **Taste profile (memory)** — a saved palate the app remembers and applies to every recommendation.
- **Party Mode** — mark tonight's open bottles + cocktails, share a login-free link; guests see only that evening's menu.

## Stack
- **Next.js 14** (App Router, TypeScript) on **Vercel**
- **Supabase** — Postgres + email/password auth + row-level security (admin read/write vs. shared read-only viewer)
- **Claude (`claude-opus-4-8`)** via the Anthropic SDK — vision bottle identification + sommelier recommendations (server-side API routes)
- **Resend** — weekly dispatch (restock list + sommelier's pick), sent via a Vercel Cron job
- **Tailwind CSS** — colonial theme (British racing green, oxblood, brass, parchment; Playfair Display + EB Garamond)

## Setup
See **[SETUP.md](./SETUP.md)** for the full step-by-step deployment guide.

## Local development
```
cp .env.local.example .env.local   # fill in your Supabase + Resend values
npm install
npm run dev
```
Run `supabase-schema.sql` in your Supabase project's SQL Editor first.

## Design notes
- Palette & fonts: `tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`
- Cocktail canon & neat-pour logic: `src/lib/cocktails.ts`
- Spirit categories (the recommender's ingredient vocabulary): `src/lib/categories.ts`
- Bottle levels & restock threshold: `src/lib/levels.ts`
- AI model & client: `src/lib/ai.ts` (change `MODEL` to swap Claude tiers)
- Taste profile schema: `src/lib/taste.ts`
- AI endpoints: `src/app/api/identify` (vision) and `src/app/api/recommend` (sommelier)
