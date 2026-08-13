# HanyuGo

Self-paced Mandarin Chinese learning platform, HSK 1 → HSK 9, built with a Duolingo-like UI
and a textbook-plus-workbook learning model. See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for the
full plan (architecture, database schema, roadmap, and the personal learning path this project
is designed to teach).

## Structure

```
apps/web        React + Vite + TypeScript + Tailwind frontend (Cloudflare Pages)
apps/api        Cloudflare Worker + Hono backend API
packages/shared Shared TypeScript types used by both web and api
data/hsk30      HSK 3.0 vocabulary data + the Python seed script
```

## Local development

```bash
npm install

# terminal 1 — API worker (http://localhost:8787)
npm run dev:api

# terminal 2 — frontend (http://localhost:5173, proxies /api to the worker)
npm run dev:web
```

Open http://localhost:5173 — you should see the HanyuGo card with an "API online" pill once
both are running.

## Deployment

Deployment is automated via `.github/workflows/deploy.yml` on every push to `main`. You need to:

1. Create a [Cloudflare](https://dash.cloudflare.com) account (free tier is enough for Stage 1).
2. Create a Cloudflare Pages project named `hanyugo` (or update the name in the workflow).
3. Generate an API token at `dash.cloudflare.com/profile/api-tokens` with Workers + Pages edit
   permissions.
4. In your GitHub repo, go to Settings → Secrets and variables → Actions, and add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
5. Push to `main` — GitHub Actions builds and deploys both the frontend and the API worker.

## Status

Stage 1 scaffold: frontend + API skeleton wired together with a health check. Next: D1 database,
auth, and the HSK 1 lesson/practice/notebook flow — see PROJECT_PLAN.md section 15.
