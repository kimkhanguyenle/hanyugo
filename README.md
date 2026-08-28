# HanyuGo

A Mandarin learning app built around the official HSK 3.0 vocabulary
(2026-revised scheme) — lessons, pinyin practice with tone grading, stroke-order
writing, a personal review list, and streak tracking.

**New here? Read [SETUP.md](./SETUP.md).** It walks you from nothing to a live
public URL in about 20 minutes, with no terminal.

---

## Architecture

```
Browser (React + Vite, hosted on Vercel)
        │
        └── @supabase/supabase-js
                │
                └── Supabase
                    ├── Postgres  — course content + learner progress
                    ├── Auth      — signup, login, password reset
                    └── RLS       — per-row access control
```

There is no application server. The browser queries Postgres directly, and
**Row Level Security** decides what each signed-in user may read or write. That
removes a whole deployable component — and with it, a class of bugs where an
endpoint forgets its permission check.

Logic that genuinely belongs on the server side (streak calculation, recording a
practice result) lives in **Postgres functions**, so it runs next to the data in
a single round-trip and can't half-complete.

---

## Project layout

```
src/
  api.ts               All data access. One function per operation.
  lib/supabase.ts      The Supabase client (reads env vars).
  context/             Auth state (AuthContext).
  components/          Layout, navigation, shared UI.
  pages/               One file per screen.
  locales/             UI translations: en, es, vi, ko, fr.
  types/shared.ts      Types shared between the app and the database shape.
supabase/
  migrations/
    001_schema.sql     Tables, indexes, RLS policies.
    002_functions.sql  Dashboard / practice / review logic.
  seed/
    seed_hsk1..7.sql   The HSK vocabulary (10,057 words total).
```

---

## The data model

| Table | Holds | Who can read it |
|---|---|---|
| `profiles` | display name, email | only you, your own row |
| `hsk_words` | the vocabulary | any signed-in user (read-only) |
| `lessons`, `lesson_words` | how words group into lessons | any signed-in user (read-only) |
| `user_word_progress` | your streak/status per word | only you |
| `user_lesson_progress` | lesson completion | only you |
| `activity_log` | one row per practice event | only you (append-only) |

`activity_log` is deliberately insert-only for clients: you can add to your
history but never rewrite it, so a streak can't be faked from the browser.

---

## Database functions

| Function | Used by | Why it's server-side |
|---|---|---|
| `get_dashboard_summary()` | Dashboard | Replaces 5 separate queries with one. |
| `record_practice_result(word, correct)` | Practice | Updates progress *and* logs activity atomically. |
| `set_word_status(word, status, note)` | Lesson / Review | Preserves an existing note; logs the action. |
| `get_review_queue()` | Review | Joins progress to words in one call. |

Two behaviours worth knowing, both carried over deliberately:

- **Streak:** counts consecutive days backwards from today. If you haven't
  practiced *yet today*, it counts from yesterday — you don't lose a streak
  before the day is over.
- **Starred words stay starred.** Answering correctly won't silently un-star a
  word you marked for review.

---

## Local development (optional)

```
npm install
npm run dev
```

Requires a `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` —
copy `.env.example`. Note it points at your real Supabase project, so changes
affect live data; consider a second Supabase project for experimenting.

## Deployment

Push to `main` → Vercel builds and publishes automatically. Rollback is
Deployments → pick a previous one → **Promote to Production**.

---

## Security notes

- The `anon` key is **meant** to be public. RLS is the protection.
- The `service_role` key must never appear in this repo or any frontend code.
- All database functions derive the user from `auth.uid()`, never from a
  client-supplied id, so a caller cannot act as someone else.
