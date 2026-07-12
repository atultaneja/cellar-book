# The Cellar Book

A home-bar inventory, restock, and recommendation app with a Royal-British-Club aesthetic.
Mobile-first, cloud-synced, with a shareable guest "Party Mode".

## What it does
- **Cellar** — catalogue 100+ bottles with quick tap-levels (Full → Empty), bulk-add for first load, search & filter by category.
- **Restock** — everything low or empty in one list; emailed to you automatically each Monday.
- **Recommend** — cocktails you can make right now from what's in stock, neat pours by mood, and "one bottle short" suggestions.
- **Party Mode** — mark tonight's open bottles + cocktails, share a login-free link; guests see only that evening's menu.

## Stack
- **Next.js 14** (App Router, TypeScript) on **Vercel**
- **Supabase** — Postgres + magic-link auth + row-level security
- **Resend** — weekly restock email, sent via a Vercel Cron job
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
