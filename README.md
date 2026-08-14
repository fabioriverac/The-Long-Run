# The Long Run

A personal lifestyle website built around three pillars: **fitness** (sub-3
marathon training), **cooking** (recipes and food discoveries), and
**personal growth** (habits and mindset).

## Stack

- [React 19](https://react.dev/) + [React Router](https://reactrouter.com/)
- [Vite](https://vite.dev/) for dev/build tooling
- Plain CSS with a shared design-token layer (`src/index.css`) — no CSS
  framework
- [Recharts](https://recharts.org/) for dashboard charts
- Deployed to [Vercel](https://vercel.com/)

## Project structure

```
src/
  components/            Reusable, presentational building blocks
    dashboards/          Fitness dashboard panels (Running page)
  pages/                 One file per route (Home, Running, Cooking, Blog, About)
  data/                  Repository modules + build-time content
    garmin/               Synced Garmin JSON (runs.json, runs-latest.json,
                             runs-archive.json, training-status.json)
  lib/                   Chart theme
  utils/                 Formatting/date helpers
scripts/
  sync-garmin.mjs         Maps Garmin MCP output into src/data/garmin/*.json
  lib/                    Per-domain Garmin → row mapping (pure functions)
```

Pages are composed from small components; components don't know about
routing beyond linking to a path. Each content type has a **repository
module** (`src/data/*Repository.js`) — right now these read plain JSON
files, imported at build time, but the module boundary is what pages
actually depend on. If a content type ever needs a live backend, only its
repository module changes.

## Getting started

```bash
npm install
npm run dev      # start local dev server
npm run build    # production build to dist/
npm run preview  # preview the production build locally
npm run lint      # oxlint
npm test          # vitest — scripts/lib/* and src/utils/* pure-function coverage
```

Requires Node matching the `engines` field in `package.json` (currently
`^20.19.0 || >=22.12.0`, the same floor Vite itself requires).

## The fitness dashboard (`/running`)

Training data is Garmin-sourced, published as build-time JSON rather than a
live database — the site only ever needs `select * order by date limit n`
with no writes, no auth, and no real-time requirement, and data changes
about once a day. That's a JSON file, not a database.

Since Garmin data is only reachable through the CustomGarmin MCP tool
(callable only from an authenticated Claude Code agent session — never from
a public site or a plain CI job), a scheduled Claude Code Routine does the
whole pipeline:

```
Garmin → CustomGarmin MCP → scripts/sync-garmin.mjs → src/data/garmin/*.json
                                                      → commit → push
```

- `scripts/sync-garmin.mjs` takes a JSON file (the raw output of the
  `list_activities` / `get_training_status` MCP tools), maps it via the
  pure functions in `scripts/lib/`, and **merges** it into the existing
  data on disk (it never trusts the input to be the complete history — see
  the comment at the top of the script). It writes:
  - `src/data/garmin/runs.json` — last 365 days, for the Running page log
  - `src/data/garmin/runs-archive.json` — everything older, never deleted
  - `src/data/garmin/runs-latest.json` — a small slice for the Home page
  - `src/data/garmin/training-status.json` — last 90 days

  Deterministic, no network calls, no credentials.
- The repository modules (`src/data/runsRepository.js`,
  `src/data/latestRunsRepository.js`, `trainingStatusRepository.js`) just
  import those JSON files directly.
- A Claude Code Routine runs this daily and pushes the result straight to
  this repo's active branch — there's no separate `dev` branch in this
  project's workflow, just direct commits (or PRs, same as any other
  change).

No secrets are involved anywhere in this pipeline — no database credential,
no `.env.local`, no cloud env var. The only thing that can reach the Garmin
data is an authorized agent session, and the only thing it produces is
plain JSON with training metrics — no sleep, heart-rate, or health data
leaves Garmin.

To sync manually: fetch fresh data via the Garmin MCP tools, write it to a
JSON file shaped like the comment at the top of `scripts/sync-garmin.mjs`,
then run:

```bash
node scripts/sync-garmin.mjs path/to/data.json
```

## Deploying

This is a static Vite app — on Vercel, use framework preset **Vite**, build
command `npm run build`, output directory `dist`. Because routing is
client-side (React Router), make sure Vercel's rewrite rule sends all paths
to `index.html` (`vercel.json` in this repo already does this).

`vercel.json` also sets cache headers: Vite's hashed `/assets/*` files are
cached for a year as immutable (safe — the filename itself changes
whenever the content does), while `index.html` and everything else are
served with `max-age=0, must-revalidate` so a new deploy is always picked
up on next load instead of serving a stale HTML shell pointing at
since-evicted asset hashes.
