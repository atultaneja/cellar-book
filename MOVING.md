# Moving the project to a new Mac

**You are not moving the app — the app lives in the cloud.** Nothing about the live
site, your logins, or your inventory changes. What you're doing is setting up the
**new Mac to keep working on the code**. Here's the whole picture:

| Thing | Where it lives | Moves with the Mac? |
|---|---|---|
| The source code | GitHub (`atultaneja/cellar-book`) | No — you pull a copy down |
| The live website | Vercel | No — stays exactly as is |
| Your data (bottles, pours) | Supabase | No — stays exactly as is |
| The secret keys | Vercel (production) | No — already set there |
| Node, tools, this folder | Your old Mac | Re-created on the new Mac |

So on the new Mac you don't copy files by hand — you **clone** a fresh copy from
GitHub and install the dependencies. Do it in this order.

---

## Step 1 — Install the basics (Terminal)

Open **Terminal** (Cmd+Space → type `Terminal` → Return). Paste each line, press Return,
wait for it to finish before the next.

1. Homebrew (the installer for the rest). If `brew` already exists, skip this.
   ```
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. Node.js (runs the build) and the GitHub helper:
   ```
   brew install node gh
   ```

**You should see:** `node -v` prints a version (v20 or higher).

## Step 2 — Sign in to GitHub (as the right account!)

```
gh auth login
```
Choose **GitHub.com → HTTPS → Yes (authenticate git) → Login with a web browser**.
Copy the one-time code it shows, press Return, and authorize in the browser.

> ⚠️ **Sign in as `atultaneja`** — the account that owns the `cellar-book` repo. If you
> sign in with a *different* GitHub account, `git push` will fail with a "permission
> denied" 403. If that happens, run `gh auth login` again and pick `atultaneja`, then
> `gh auth setup-git`, then retry the push.

## Step 3 — Get the code

Pick a home for it, then clone:
```
cd ~/Desktop
git clone https://github.com/atultaneja/cellar-book.git
cd cellar-book
npm install
```

**You should see:** an `Added N packages` message. The full project is now on the
new Mac, identical to the old one.

## Step 4 — Point your AI coding tool at it

Install **Claude Code** on the new Mac the same way you use it now (the desktop app
or CLI — see docs.claude.com/claude-code), sign in with your Anthropic account, and
**open the `~/Desktop/cellar-book` folder** as the working directory. That's it — you're
back where you were, with the whole history.

---

## The everyday loop (unchanged)

Edit → check it builds → push. A push auto-deploys to Vercel:
```
npm run build          # optional local check
git add -A
git commit -m "what changed"
git push
```
Within ~2 minutes the live site updates. Nothing to touch in Vercel or Supabase —
same accounts, same project.

## Optional — running it locally on the new Mac

Only needed if you want to run `npm run dev` and see it at `localhost:3000` before
pushing. Create a file named `.env.local` in the project folder with these values
(copy each from **Vercel → your project → Settings → Environment Variables**):

```
NEXT_PUBLIC_SUPABASE_URL=...        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Supabase publishable key
SUPABASE_SERVICE_ROLE_KEY=...       # Supabase secret key
ANTHROPIC_API_KEY=...               # Claude key
ADMIN_EMAIL=...                     # your owner-login email
RESEND_API_KEY=...                  # (only if testing the weekly email locally)
RESTOCK_EMAIL_TO=...
RESTOCK_EMAIL_FROM=Tantaan Tiki Bar <onboarding@resend.dev>
CRON_SECRET=...
```
This file is git-ignored on purpose (secrets never go to GitHub).

## Retiring the old Mac

Once the new Mac clones and builds successfully, the old folder is disposable —
everything of value is in GitHub, Vercel, and Supabase. If you want, delete the old
`~/Desktop/GTM Attainment App/royal-club-cellar` folder; nothing is lost.
