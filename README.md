# Becoming Self

A personal lifestyle website built around three pillars: **fitness** (sub-3
marathon training), **cooking** (recipes and food discoveries), and
**personal growth** (habits and mindset).

## Stack

- [React 19](https://react.dev/) + [React Router](https://reactrouter.com/)
- [Vite](https://vite.dev/) for dev/build tooling
- Plain CSS with a shared design-token layer (`src/index.css`) — no CSS
  framework
- Deployed to [Vercel](https://vercel.com/)

## Project structure

```
src/
  components/   Reusable, presentational building blocks (Navbar, cards, ...)
  pages/        One file per route (Home, Running, Cooking, Blog, About)
  data/         Mock content (runs, recipes, posts, pillars) — swap for a
                real API/CMS later
```

Pages are composed from small components; components don't know about
routing beyond linking to a path. Content lives in `src/data/*.js` so the
mock data can later be swapped for a real API or CMS without touching page
layout.

## Getting started

```bash
npm install
npm run dev      # start local dev server
npm run build    # production build to dist/
npm run preview  # preview the production build locally
npm run lint      # oxlint
```

## Deploying

This is a static Vite app — on Vercel, use framework preset **Vite**, build
command `npm run build`, output directory `dist`. Because routing is
client-side (React Router), make sure Vercel's rewrite rule sends all paths
to `index.html` (Vercel's Vite preset does this automatically; if not, add a
`vercel.json` with a catch-all rewrite to `/index.html`).
