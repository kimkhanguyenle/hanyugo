# HanyuGo — Self-Study Chinese Learning Platform

Project plan v1 · Drafted 2026-08-11 · Owner: Kelvin (BIT, Year 1) · Mentor: Claude

## 1. Vision

A self-serve website for learning Mandarin from HSK 1 to HSK 9, built for people who won't go to a center or hire a tutor. It behaves like a textbook (lessons) plus a workbook (practice, notes, flashcards), it's usable by any age, and it's optimized for people who want to *communicate* — so typing pinyin is the primary input method everywhere, not stroke recall.

For you, this project is also the vehicle for going from "foundation-level Python/HTML/CSS/Java/SQL" to a working full-stack developer with something real and deployed to show for it. Every stage below has a matching "what you'll learn" note.

## 2. Decisions locked in so far

| Area | Decision |
|---|---|
| UI style | Duolingo-like: bright, card-based, gamified progress (streaks, badges, progress bars) |
| Stack | JavaScript/TypeScript full-stack |
| Stage 1 scope | Small real MVP — HSK 1 only, fully working end-to-end |
| Hosting | GitHub (source + CI) + Cloudflare (Pages/Workers/D1 for hosting + edge) |
| Content source | Standard HSK 3.0 (2021), levels 1–9 |
| Input method | Pinyin typing (with tone marks or tone numbers), not handwriting recall |
| Monetization | Free in Stage 1, optional paid tier introduced in Stage 2 once there's real usage |

## 3. Tech stack (and why, for your learning)

- **Frontend:** React + TypeScript, built with Vite. Deployed as static assets to **Cloudflare Pages**.
  - *Why:* React is the most in-demand frontend skill, TypeScript catches bugs before runtime (huge jump from plain JS), Vite is the modern standard replacing older tools like Create React App.
- **Backend/API:** **Cloudflare Workers** (TypeScript) using the Hono framework for routing.
  - *Why:* Workers run on Cloudflare's edge network in 300+ cities — this is what actually satisfies your requirement #11 (low latency everywhere) without you having to manually configure a CDN. Hono is a lightweight, beginner-friendly router (similar mental model to Express/Flask, which will feel familiar from Python).
- **Database:** **Cloudflare D1** (managed SQLite at the edge) for structured data (users, progress, vocab). **Cloudflare KV** for simple cached lookups if needed later.
  - *Why:* Directly builds on your SQL foundation — you'll write real schema and queries, just against SQLite instead of MySQL/Postgres, and it deploys with zero server management.
- **Auth:** Start with Cloudflare's own primitives + a library like **Lucia Auth** or **better-auth** for email/password + email verification; add OAuth (Google login) once core auth works.
  - *Why:* Teaches you real authentication concepts (password hashing, sessions, tokens, email verification flows) rather than hiding it behind a no-code tool.
- **Styling:** Tailwind CSS.
  - *Why:* Fastest way to hit "modern, professional-looking" without needing a design background; huge industry adoption.
- **Version control/CI:** GitHub + GitHub Actions to auto-deploy to Cloudflare on every push to `main`.
- **Later (Stage 2):** Stripe for payments, a proper object store (Cloudflare R2) for audio files (listening practice).

You already know Python and Java — you are **not** abandoning them. Python is excellent for the one-off script we'll write to clean and import the HSK 3.0 vocabulary data into the database. Java/SQL foundations transfer directly into understanding TypeScript types and D1's SQL.

## 4. System architecture (Stage 1)

```
Browser (React SPA, Cloudflare Pages)
        │  HTTPS/JSON
        ▼
Cloudflare Worker API (Hono, TypeScript)
        │
        ├── D1 (SQLite): users, vocab, lessons, progress, notebook entries
        ├── Auth: sessions/tokens, password hashes
        └── (Stage 2) R2: audio files · Stripe: billing
```

Everything sits on Cloudflare's edge, which is what gives you low latency worldwide without a traditional server to manage.

## 5. Core database schema (Stage 1 draft)

```sql
-- users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  email_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- hsk_words (seeded once from the HSK 3.0 dataset, see section 6)
CREATE TABLE hsk_words (
  id INTEGER PRIMARY KEY,
  hanzi TEXT NOT NULL,
  pinyin TEXT NOT NULL,          -- with tone marks, e.g. "nǐ hǎo"
  pinyin_numbered TEXT NOT NULL, -- e.g. "ni3 hao3", used for typed-answer matching
  meaning_en TEXT NOT NULL,
  hsk_level INTEGER NOT NULL,    -- 1-9
  part_of_speech TEXT
);

-- lessons (groups of words + a short teaching passage, like a textbook chapter)
CREATE TABLE lessons (
  id INTEGER PRIMARY KEY,
  hsk_level INTEGER NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

CREATE TABLE lesson_words (
  lesson_id INTEGER REFERENCES lessons(id),
  word_id INTEGER REFERENCES hsk_words(id),
  PRIMARY KEY (lesson_id, word_id)
);

-- per-user progress on each word (this IS the spaced-repetition engine)
CREATE TABLE user_word_progress (
  user_id TEXT REFERENCES users(id),
  word_id INTEGER REFERENCES hsk_words(id),
  status TEXT DEFAULT 'new',     -- new | learning | known | marked_for_review
  correct_streak INTEGER DEFAULT 0,
  next_review_at TEXT,           -- drives the "review later" workbook queue
  note TEXT,                     -- personal note, e.g. a mnemonic
  PRIMARY KEY (user_id, word_id)
);

-- lesson completion tracking
CREATE TABLE user_lesson_progress (
  user_id TEXT REFERENCES users(id),
  lesson_id INTEGER REFERENCES lessons(id),
  completed_at TEXT,
  score INTEGER,
  PRIMARY KEY (user_id, lesson_id)
);
```

This schema already gives you requirement #6 (note-taking + "mark for later" behavior like a workbook) via `user_word_progress`.

## 6. Where the content comes from (HSK 3.0)

The 2021 Standard is the official Ministry of Education document (528 pages, 11,092 words across 9 levels, 527 grammar points). Rather than transcribing it by hand, use existing cleaned, open-source datasets and treat the official standard as the source of truth for validation:

- Official standard (Chinese, PDF): [Ministry of Education 2021 announcement](http://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/s5987/202103/W020210329527301787356.pdf)
- [ivankra/hsk30](https://github.com/ivankra/hsk30) — clean CSV, one row per term, all 11,092 HSK 3.0 words with pinyin/POS
- [krmanik/HSK-3.0](https://github.com/krmanik/HSK-3.0) — HSK 1–9 hanzi, words, and **grammar point lists**, plus Anki deck format (useful reference for spaced-repetition fields)
- [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) — JSON, cross-references HSK 2.0 and 3.0
- [HSKLord HSK 3.0 vocabulary PDFs by level](https://hsklord.com/blog/hsk-3-0-vocabulary-download) — good for manual spot-checking

Plan: write a small Python script (plays to your existing strength) that ingests `hsk30.csv`, filters to HSK 1, cleans/normalizes pinyin into both toned and numbered forms, and outputs a seed SQL file for the `hsk_words` table. This becomes your first real "data pipeline" — a genuinely valuable skill outside web dev too.

## 7. Stage 1 MVP — exact scope

Ship this, fully working, before touching HSK 2+:

1. **Auth:** register, login, logout, email verification, password reset. Sessions via secure HTTP-only cookies.
2. **HSK 1 content:** all ~150 HSK1 words loaded, organized into ~10 lessons.
3. **Lesson view ("textbook side"):** hanzi + pinyin + meaning + example sentence, audio playback optional/deferred.
4. **Practice view ("workbook side"):** pinyin-typing exercises (see input handling below) with instant right/wrong feedback.
5. **Personal notebook:** mark any word "review later," add a personal note, see a "words to review" queue driven by `next_review_at`.
6. **Progress dashboard:** words learned, lessons completed, current streak — this is your Duolingo-style card UI.
7. **Deployed** to a real `*.pages.dev` (or your own domain later) via GitHub Actions → Cloudflare, so it's a link you can actually share.

Explicitly **out of scope** for Stage 1: listening/speaking practice, HSK 2–9, payments, social features, mobile app. Those are Stage 2+.

## 8. Pinyin typing input (requirement #8)

This is a genuinely interesting technical problem, not just a text field:

- Store two pinyin forms per word: toned (`nǐ hǎo`) and numbered (`ni3 hao3`).
- Accept numbered-tone input everywhere (`ni3`) since that's what works reliably on every keyboard/device with no special input method — then render the toned version back to the user as feedback. This directly serves "works on all devices."
- Normalize input before comparing: lowercase, strip extra spaces, allow optional tone numbers to be omitted for partial credit vs. strict grading (configurable difficulty).
- Later refinement: accept both `ü` and `v` as equivalent (a real convention learners already know from Chinese input methods).

## 9. UI direction (Duolingo-like)

Bright surfaces, rounded cards, a persistent progress bar per lesson, streak counter, and a lesson map (path of nodes) for HSK1's ~10 lessons. Inside a lesson, split into a "learn" pane (textbook) and "practice" pane (workbook) per requirement #6/#2 — so it's Duolingo's approachability with a textbook's structure underneath, not either one alone.

## 10. Privacy & verification (requirement #9)

- Email verification required before full access (confirms the account belongs to a real, reachable person).
- Passwords hashed with a modern algorithm (e.g. `bcrypt`/`argon2` via a Workers-compatible library) — never stored plain.
- Session tokens, not passwords, stored in cookies; short-lived + refreshable.
- Each user's data (progress, notes) scoped strictly by `user_id` at the query level — no user can read another's rows.
- Minimal data collection principle: only email + display name required at signup.

## 11. SEO & performance (requirements #11, #12)

- Server-rendered or statically pre-rendered marketing/landing pages (the lesson app itself can be a client-rendered SPA behind login, but public pages need real HTML for crawlers).
- Semantic HTML, descriptive `<title>`/meta tags per page, an `robots.txt` and `sitemap.xml`, alt text on images.
- Cloudflare's edge network handles the "fast from anywhere" requirement structurally — pair it with image optimization and code-splitting in the React build.
- Track Core Web Vitals (LCP, CLS, INP) via Lighthouse in CI as a habit, not a one-time check.

## 12. Stage 2 (post-traction)

- Expand content to HSK 2 → HSK 9, all four skills (listening via audio + R2 storage, speaking via recording + playback, reading, writing).
- Introduce a paid tier (Stripe) — likely freemium: HSK1–2 free forever, HSK3+ or advanced features paywalled.
- Spaced-repetition algorithm upgrade (SM-2 or similar) instead of the simple streak-based review queue.
- Social/community features, leaderboards, mobile-friendly PWA.

## 13. Your personal learning path through this project

Roughly in the order you'll hit each topic building Stage 1:

1. TypeScript fundamentals (types, interfaces) — builds directly on Java's static typing instincts.
2. React basics (components, state, props, hooks) — the biggest new concept; budget real time here.
3. REST API design + Hono on Cloudflare Workers — feels like Flask, teaches HTTP properly.
4. SQL schema design + queries against D1 — direct extension of your SQL foundation.
5. Authentication concepts (hashing, sessions, verification emails) — security fundamentals every dev needs.
6. Git/GitHub workflow + CI/CD via GitHub Actions — professional dev workflow, not just `git push`.
7. Deployment & DNS basics via Cloudflare — how the internet actually serves your app to the world.
8. Python data-wrangling script for the HSK seed data — a fast, low-stakes way to use Python meaningfully in this project.

## 14. Suggested repo structure

```
hanyugo/
  apps/
    web/        # React + Vite frontend
    api/        # Cloudflare Worker (Hono) backend
  data/
    hsk30/      # raw + cleaned HSK vocabulary CSVs, seed scripts (Python)
  packages/
    shared/     # shared TS types between web and api
  .github/workflows/deploy.yml
  PROJECT_PLAN.md
```

## 15. Immediate next steps

1. Confirm this plan (or flag anything you want changed).
2. Set up the GitHub repo with the structure above.
3. Scaffold the Vite+React frontend and a "hello world" Cloudflare Worker, get both deploying via GitHub Actions.
4. Write the Python seed script for HSK1 vocabulary from `ivankra/hsk30`.
5. Build the D1 schema and auth flow.
6. Build lesson view → practice view → notebook, in that order.

Sources consulted for HSK 3.0 content data: [ivankra/hsk30](https://github.com/ivankra/hsk30), [krmanik/HSK-3.0](https://github.com/krmanik/HSK-3.0), [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary), [HSKLord vocabulary downloads](https://hsklord.com/blog/hsk-3-0-vocabulary-download), [Ministry of Education 2021 standard (PDF)](http://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/s5987/202103/W020210329527301787356.pdf).
