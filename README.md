# Becoming Self

A personal lifestyle website built around three pillars: **fitness** (sub-3
marathon training), **cooking** (recipes and food discoveries), and
**personal growth** (habits and mindset).

## Stack

- [React 19](https://react.dev/) + [React Router](https://reactrouter.com/)
- [Vite](https://vite.dev/) for dev/build tooling
- Plain CSS with a shared design-token layer (`src/index.css`) — no CSS
  framework
- [Supabase](https://supabase.com/) (Postgres) for the fitness dashboard's
  live training data
- [Recharts](https://recharts.org/) for dashboard charts
- Deployed to [Vercel](https://vercel.com/)

## Project structure

```
src/
  components/            Reusable, presentational building blocks
    dashboards/          Fitness dashboard panels (Running page)
  pages/                 One file per route (Home, Running, Cooking, Blog, About)
  data/                  Repository modules + static fallback content
  hooks/                 Shared hooks (useAsyncData)
  lib/                   Supabase client, chart theme
  utils/                 Formatting/date helpers
scripts/
  sync-garmin.mjs        Ingestion entrypoint (run by a scheduled Routine)
  lib/                   Per-domain Garmin → Supabase row mapping
supabase/migrations/     SQL schema
```

Pages are composed from small components; components don't know about
routing beyond linking to a path. Each content type has a **repository
module** (`src/data/*Repository.js`) that queries Supabase and falls back
to static mock data (`*.fallback.js`) if Supabase isn't configured or a
query fails/returns empty — so the site never shows a broken or blank
state, with or without a Supabase project connected.

## Getting started

```bash
npm install
npm run dev      # start local dev server
npm run build    # production build to dist/
npm run preview  # preview the production build locally
npm run lint      # oxlint
```

Copy `.env.example` to `.env.local` and fill in your Supabase project's URL
and anon key to see real data locally; without it, the site runs fine on
static fallback data.

## The fitness dashboard (`/running`)

Training data is Garmin-sourced. Since MCP tools (used to read Garmin data)
only work inside an authenticated Claude Code agent session — never
reachable by a public website directly — data flows through a small
pipeline instead of a live API call:

```
Garmin → CustomGarmin MCP → scripts/sync-garmin.mjs (scheduled Routine) → Supabase → site
```

- `scripts/sync-garmin.mjs` takes a JSON file (the raw output of the
  `list_activities` / `get_training_status` / `get_daily_health` /
  `get_sleep` MCP tools) and upserts it into four Supabase tables —
  idempotent, safe to re-run.
- A Claude Code Routine fires this on a schedule.
- The site reads only from Supabase, via `@supabase/supabase-js` with the
  public anon key, restricted to read-only by Row Level Security (see
  `supabase/migrations/0001_fitness_dashboard.sql`). No secret ever ships
  to the browser.

To sync manually: fetch fresh data via the Garmin MCP tools, write it to a
JSON file shaped like the comment at the top of `scripts/sync-garmin.mjs`,
then run:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/sync-garmin.mjs path/to/data.json
```

## Deploying

This is a static Vite app — on Vercel, use framework preset **Vite**, build
command `npm run build`, output directory `dist`. Because routing is
client-side (React Router), make sure Vercel's rewrite rule sends all paths
to `index.html` (`vercel.json` in this repo already does this). Add
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as Environment Variables in
the Vercel project (Production + Preview) so the deployed site can read
real data — see `.env.example`.
