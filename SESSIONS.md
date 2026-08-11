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
