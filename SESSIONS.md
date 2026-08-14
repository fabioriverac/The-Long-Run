# Sessions Log

A running log of work done on this repo across sessions, for continuity.

## 2026-08-11 — Initial scaffold: Becoming Self

Built the first version of **Becoming Self**, a personal lifestyle website
covering three pillars: fitness (sub-3 marathon training), cooking, and
personal growth (habits/mindset).

**Stack:** React 19 + React Router + Vite, plain CSS (no framework),
deployed to Vercel. Same stack family as the habit tracker project.

**What shipped:**
- Pages: Home, Running, Cooking, Blog, About (+ a 404 fallback)
- Home: hero w/ tagline, three-pillars overview, latest runs, latest
  recipes, latest blog post preview
- Component-based structure: `src/components` (Navbar, Footer, Layout,
  Hero, SectionHeader, RunCard, RecipeCard, PostCard, FeaturedPost,
  PillarsGrid) + `src/pages` + `src/data` (mock content, no backend yet)
- Design system as CSS custom properties in `src/index.css`: warm earthy
  palette (clay/terracotta, olive, cream/sand), Fraunces (display) +
  Inter (body) via Google Fonts, generous whitespace, pill buttons/tags
- Responsive nav with mobile hamburger; `vercel.json` SPA rewrite for
  client-side routing
- Verified: `npm run lint` (oxlint, clean), `npm run build` (clean),
  visual check via Playwright screenshots at desktop + mobile widths

**Known gaps / follow-ups for next session:**
- All content (runs, recipes, posts) is mock data in `src/data/*.js` —
  no CMS/API/backend wired up yet
- No individual post/recipe detail pages — cards link to list pages only
- No tests written yet
- Not yet deployed to Vercel (needs to be connected to this repo/branch)
- No image assets used anywhere yet (text-only design)

## 2026-08-14 — Garmin sync hardening, bug fixes, deploy safety, rename

Several follow-up sessions on **Becoming Self**, working through a queued
plan: make the Garmin data pipeline safe to run unattended, fix two real
bugs found in dashboard code, tighten deploy config, and rename the site.

**Session 1 — merge-safe sync + archive:** `scripts/sync-garmin.mjs`
previously overwrote `runs.json` wholesale from whatever range of
activities it was given — a scheduled sync asking for only the last 45
days would have silently dropped the other ~170 days of history on its
first run. Rewrote it to read the existing `runs.json` +
`runs-archive.json`, merge in the newly mapped activities (keyed by
`garmin_activity_id`, incoming wins on conflict), then re-split the
combined set by the 365-day window — recent to `runs.json`, aged-out to
`runs-archive.json`, which is never deleted. Same treatment for
`training-status.json`. Verified against the real 215-run history.

**Session 2 — harden sync mapping, add Vitest:** `scripts/lib/*.js` was
coercing required fields (`activity_id`, `distance_meters`,
`duration_seconds`, `date`) with `Number(x)`, silently turning a missing
field into `NaN`/`undefined` — and `NaN` as a dedup key collapsed
multiple bad records into one, dropping data with no error. Added
`requireNumber`/`requireString` (throw with the field name and offending
value) plus a floor check rejecting `distance_km <= 0` or
`duration_seconds <= 0`. Running the hardened mapper against the real
Garmin feed (500 activities, 2020–2026) immediately caught a live bad
record — a real 10km activity with `duration_seconds: "0"`, almost
certainly a duplicate/GPS artifact. That surfaced a design gap: one bad
record was aborting the *entire* sync, which would block an unattended
scheduled Routine indefinitely. Changed the batch mappers to catch each
per-record throw, log it loudly, and skip just that record. Added
`scripts/lib/*.test.js` (Vitest, 38 tests) and wired `npm test` into CI.

**Session 3 — fix `groupByWeek` bugs:** the weekly-volume chart behind
`/running` was silently omitting rest weeks (weeks with zero runs)
instead of showing them as a zero bar — since the chart takes the last 12
entries off the array, a training gap compressed its timeline so "last 12
weeks" could span more than 12 real calendar weeks. Confirmed against the
real training log: 2 real rest weeks existed and were being dropped.
Also guarded a `NaN` propagation from a missing `distance_km` (once a
week's running total went `NaN` it could never recover). Added
`src/utils/groupByWeek.test.js` (9 tests).

**Session 4 — deploy safety:** added Vercel `Cache-Control` headers
(hashed `/assets/*` cached a year as immutable; everything else
`max-age=0, must-revalidate` so a new deploy is always picked up).
Pinned `package.json` `engines.node` to match Vite's own requirement.
Corrected two stale README claims: a described "push to dev, merge to
master" flow that never existed in this repo's actual git history, and
`runs-latest.json`/`runs-archive.json` missing from the docs.

**Session 5 — renamed to The Long Run:** swapped the site's name
everywhere it appears as a wordmark, title, or brand reference — Navbar,
Footer, `index.html`, `package.json`, README, the design-tokens comment
in `src/index.css`, and the About page (including the narrative
paragraph, not just the heading). This log's past entries are left as
they were written, under the old name, since they're a historical record
of what the site was called at the time.

`npm run lint` / `npm test` (47 tests) / `npm run build` all clean
throughout.
