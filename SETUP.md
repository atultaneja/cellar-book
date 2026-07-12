# Tantaan Tiki Bar — Setup Guide

A step-by-step guide to putting your home-bar app on the web. No coding required —
you'll copy, paste, and click. Budget **30–40 minutes** the first time.

You'll create **three free accounts** and connect them:

| Service | What it does | Cost |
|---|---|---|
| **GitHub** | Holds the app's code | Free |
| **Supabase** | Stores your bottles + handles your login | Free |
| **Vercel** | Puts the app on the web | Free |
| **Resend** | Sends the weekly restock email | Free |
| **Anthropic (Claude)** | Reads bottle photos + powers recommendations | Pay-as-you-go (pennies) |

Do the steps **in order**. Each one ends with "you should see…" so you know it worked.

---

## Part 1 — Put the code on GitHub (5 min)

1. Go to **[github.com](https://github.com)** and sign up (or sign in).
2. Click the **+** at the top-right → **New repository**.
3. Name it `cellar-book`. Leave everything else default. Click **Create repository**.
4. On your Mac, open **Terminal** (press `Cmd+Space`, type `Terminal`, press `Return`).
5. Paste this and press `Return` (it moves into the app folder):
   ```
   cd "/Users/atul/Desktop/GTM Attainment App/royal-club-cellar"
   ```
6. Paste these lines **one block at a time**, pressing `Return` after each. Replace
   `YOUR-USERNAME` in the last line with your GitHub username:
   ```
   git init
   git add .
   git commit -m "Tantaan Tiki Bar"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/cellar-book.git
   git push -u origin main
   ```
   > If it asks you to sign in, a browser window opens — approve it, then re-run the
   > last `git push` line.

**You should see:** your files now appear at `github.com/YOUR-USERNAME/cellar-book`.

---

## Part 2 — Create the database (Supabase) (10 min)

1. Go to **[supabase.com](https://supabase.com)** → **Start your project** → sign in with GitHub.
2. Click **New project**. Give it a name (`cellar`), set a database password
   (save it somewhere), pick the region closest to you. Click **Create new project**.
   Wait ~2 minutes for it to finish setting up.
3. In the left sidebar, click **SQL Editor** → **New query**.
4. Open the file `supabase-schema.sql` (in this app folder) in **TextEdit**, select all
   (`Cmd+A`), copy (`Cmd+C`), and paste it into the Supabase query box. Click **Run**
   (bottom-right).

   **You should see:** "Success. No rows returned."

5. Now turn on email login. Left sidebar → **Authentication** → **Sign In / Providers**
   → make sure **Email** is enabled (it is by default). Under it, **turn OFF "Confirm
   email"** is NOT needed — leave defaults. The magic-link login works out of the box.
6. Get your keys. Left sidebar → **Project Settings** (gear icon) → **API**. Keep this tab
   open — you'll copy three values in Part 4:
   - **Project URL**
   - **anon public** key
   - **service_role** key (click "Reveal")

---

## Part 3 — Create the email sender (Resend) (5 min)

1. Go to **[resend.com](https://resend.com)** → sign up (free).
2. Left sidebar → **API Keys** → **Create API Key**. Name it `cellar`, permission
   **Full access**. Copy the key that appears (starts with `re_`) — you can't see it again.
3. That's enough to start. The weekly email will send from `onboarding@resend.dev` to
   **your own email**, which Resend allows for free without any domain setup.

---

## Part 3b — Get your Claude key (Anthropic) (5 min)

This powers the photo scanner and the sommelier recommendations.

1. Go to **[console.anthropic.com](https://console.anthropic.com)** → sign up.
2. Add a small amount of credit under **Billing** (usage is pennies per scan/recommendation).
3. Go to **API Keys** → **Create Key**. Copy it (starts with `sk-ant-`) — you'll paste it
   into Vercel in the next part.

---

## Part 4 — Put it on the web (Vercel) (10 min)

1. Go to **[vercel.com](https://vercel.com)** → **Sign Up** → **Continue with GitHub**.
2. Click **Add New → Project**. Find `cellar-book` in the list → **Import**.
3. **Before clicking Deploy**, expand the **Environment Variables** section and add each
   of these (name on the left, value on the right). Click **Add** after each:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase **Project URL** (from the **Data API** page, e.g. `https://xxxx.supabase.co`) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase **Publishable key** (`sb_publishable_…`) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase **Secret key** (`sb_secret_…`) |
   | `RESEND_API_KEY` | your Resend key (`re_…`) |
   | `RESTOCK_EMAIL_TO` | your email address |
   | `RESTOCK_EMAIL_FROM` | `Tantaan Tiki Bar <onboarding@resend.dev>` |
   | `CRON_SECRET` | any long random text, e.g. `cellar-7Kp2mQ9xLr4` |
   | `ANTHROPIC_API_KEY` | your Claude key (`sk-ant-…`) |

4. Click **Deploy**. Wait ~2 minutes.

   **You should see:** a congratulations screen with a preview of your app.

5. Copy your live address — it looks like `https://cellar-book-xxxx.vercel.app`.
6. Tell Supabase to trust your live address for login: Supabase → **Authentication** →
   **URL Configuration** → set **Site URL** to your Vercel address, and under
   **Redirect URLs** add `https://YOUR-ADDRESS.vercel.app/auth/callback`. Save.

**You should see:** open your Vercel address on your phone → the "Tantaan Tiki Bar"
login screen. Enter your email, tap the link it sends, and you're in.

---

## Part 5 — First use

- **Load your bar, two ways:**
  - **Scan:** tap **Cellar → 📷 Scan**, photograph a bottle or a whole shelf (up to 6 photos).
    Claude reads the labels and fills in name/brand/category; you confirm before saving.
    Fastest way through 100+ bottles.
  - **Bulk paste:** tap **Cellar → Bulk**, one bottle per line as `Name | Category`
    (e.g. `Lagavulin 16 | Scotch`). Category optional.
  - Adjust levels anytime by tapping the level bar on each bottle.
- **Set your taste profile:** tap **Recommend → Set profile**. Answer the palate questions once —
  the app remembers them and tunes every recommendation to you.
- **Ask the sommelier:** on **Recommend**, type what you're in the mood for and tap
  **Recommend me something** for a tailored pick from tonight's stock.
- **Add to your phone's home screen:** in Safari, tap the **Share** icon → **Add to Home
  Screen**. Now it opens like a normal app.
- **Weekly email:** every **Monday at 9am UTC** you get a dispatch with your restock list plus
  a "sommelier's pick of the week" chosen from your stock and taste profile. To change the day/time,
  edit the `schedule` line in `vercel.json` ([cron format](https://crontab.guru)) and push again.
- **Party mode:** tap **Party → Open the bar**, tick the bottles and cocktails on offer,
  and share the **Guest link**. Guests need no login and see only that evening's menu.

---

## Making changes later

Any time you want to change the app, edit the files, then in Terminal (from the app folder):
```
git add .
git commit -m "what I changed"
git push
```
Vercel automatically rebuilds and redeploys within ~2 minutes.

---

## If something goes wrong

- **Login link doesn't arrive:** check spam. Confirm the Supabase **Redirect URLs** in
  Part 4 step 7 exactly match your Vercel address.
- **App loads but shows no data / errors saving:** re-check the three Supabase keys in
  Vercel's Environment Variables, then redeploy.
- **Weekly email didn't send:** Vercel → your project → **Cron Jobs** shows the last run.
  You can also click it to run it manually to test. Confirm `RESEND_API_KEY` and
  `RESTOCK_EMAIL_TO` are set.
- **Nothing to email:** if no bottle is low/empty, the job intentionally sends nothing.
