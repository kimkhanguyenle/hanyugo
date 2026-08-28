# HanyuGo — Setup & Deploy

Goal: get HanyuGo running on a **real public URL**, and from then on update it
without ever opening a terminal.

You do this **once**. After that, every change deploys automatically.

Total time: about 20 minutes.

---

## What you're building

```
   Your browser  ──►  Vercel (the website)  ──►  Supabase (database + logins)
```

There is no separate API server to run or maintain. The website talks to the
database directly, and the database enforces who can see what.

---

## Step 1 — Create the Supabase project (5 min)

1. Go to <https://supabase.com> and sign in (GitHub login is easiest).
2. Click **New project**.
3. Fill in:
   - **Name:** `hanyugo`
   - **Database Password:** click *Generate*, then **save it in your password
     manager**. You won't need it day to day, but you cannot recover it later.
   - **Region:** pick the one closest to your users.
4. Click **Create new project** and wait ~2 minutes while it provisions.

---

## Step 2 — Get your two keys

1. In your project, open **Project Settings** (gear icon) → **API**.
2. Copy these two values and keep them handy:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`

> **Important:** on that page you'll also see a `service_role` key.
> **Never** put that one in this app or anywhere in a browser — it bypasses all
> security rules. Only the **anon public** key belongs here.

---

## Step 3 — Create the database tables (5 min)

In Supabase, open **SQL Editor** in the left sidebar. You'll run three things
**in this order**. For each one: click **New query**, paste, click **Run**.

**3a. The tables and security rules**
Open the file `supabase/migrations/001_schema.sql` from this project, copy all
of it, paste into the SQL editor, and **Run**.
You should see *Success. No rows returned.*

**3b. The app logic**
Same again with `supabase/migrations/002_functions.sql`.

**3c. The HSK vocabulary**
Now the course content. The files are in `supabase/seed/`.
Run them **in order**, one at a time:

| File | Adds |
|---|---|
| `seed_hsk1.sql` | 294 words |
| `seed_hsk2.sql` | 197 words |
| `seed_hsk3.sql` | 487 words |
| `seed_hsk4.sql` | 972 words |
| `seed_hsk5.sql` | 1,547 words |
| `seed_hsk6.sql` | 1,684 words |
| `seed_hsk7.sql` | 4,876 words |

You can stop after `seed_hsk1.sql` if you just want to try it — the app works
fine with only HSK 1 loaded, and you can add the rest whenever you like.

**Check it worked:** run this in the SQL editor —

```sql
select hsk_level, count(*) from hsk_words group by hsk_level order by hsk_level;
```

---

## Step 4 — Turn on email logins

1. Go to **Authentication** → **Providers**.
2. Make sure **Email** is enabled (it is by default).
3. While testing, go to **Authentication** → **Sign In / Up** and turn
   **Confirm email** *off*. That lets you register and log in instantly without
   checking your inbox. Turn it back **on** before real users arrive.

---

## Step 5 — Put the code on GitHub

Vercel deploys from GitHub, and this is what makes future updates automatic.

1. Go to <https://github.com/new>.
2. Name it `hanyugo`, choose **Private**, click **Create repository**.
3. On the next screen, click **uploading an existing file**.
4. Drag in **everything from this project folder except `node_modules`**
   (if you don't have a `node_modules` folder, just drag everything).
5. Click **Commit changes**.

---

## Step 6 — Deploy to Vercel (5 min)

1. Go to <https://vercel.com> and sign in **with GitHub**.
2. Click **Add New…** → **Project**.
3. Find your `hanyugo` repository and click **Import**.
4. Vercel detects Vite automatically — leave the build settings alone.
5. Expand **Environment Variables** and add both:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your Project URL from Step 2 |
   | `VITE_SUPABASE_ANON_KEY` | your anon public key from Step 2 |

6. Click **Deploy** and wait ~1 minute.

You now have a live URL like `https://hanyugo.vercel.app`. Open it, create an
account, and start learning.

---

## Daily use — no terminal, ever

| I want to… | What you do |
|---|---|
| Use the app | Open your Vercel URL. Bookmark it. |
| Change something | Edit the file on GitHub (pencil icon) → **Commit**. Vercel rebuilds and publishes in ~1 min, by itself. |
| Preview before publishing | Commit to a branch instead of `main`. Vercel gives that branch its own private preview URL. |
| Look at your data | Supabase → **Table Editor**. Point-and-click, like a spreadsheet. |
| Add more vocabulary | Supabase → **SQL Editor**, run the next `seed_hsk*.sql`. |
| Undo a bad change | Vercel → **Deployments** → find a working one → **Promote to Production**. Instant rollback. |

---

## Troubleshooting

**"Supabase is not configured" on the live site**
The environment variables are missing or misspelled. In Vercel:
**Settings → Environment Variables**, confirm both names are exactly
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then
**Deployments → ⋯ → Redeploy** (env vars are read at build time, so a redeploy
is required).

**I can register but the dashboard is empty**
The vocabulary hasn't been loaded. Do Step 3c.

**"permission denied for table …"**
`001_schema.sql` didn't finish. Re-run it — it's safe to run more than once.

**Login says "Invalid login credentials" for an account I just made**
Email confirmation is on and you haven't clicked the link. Either check your
email, or turn confirmation off while testing (Step 4).

---

## Optional: running it on your own computer

You don't need this — the Vercel URL is the real thing. But if you ever want a
local copy: create a file named `.env.local` next to `package.json` with your
two values (see `.env.example`), then run `npm install` and `npm run dev`.
