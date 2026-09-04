# Fantasy Survivor League — Season 51

A small Next.js app for running the family/friends Fantasy Survivor League: password-gated
signup, team drafting, a commissioner admin area for weekly scoring, and a live standings
dashboard.

## Stack

- Next.js 16 (App Router) + Tailwind
- PostgreSQL via Prisma 7 (driver adapter: `@prisma/adapter-pg`)
- Cookie-based session auth (no accounts — one shared participant password, one shared
  admin/commissioner password)

## Local setup

1. Postgres must be running locally. This project was set up against Homebrew Postgres:
   ```bash
   brew services start postgresql@18
   createdb fantasy_survivor   # first time only
   ```
2. Copy `.env.example` to `.env` and fill in real values (a `.env` is already present in this
   checkout with working local defaults — change the passwords before sharing with the league).
3. Install dependencies and apply the schema:
   ```bash
   npm install
   npx prisma migrate dev
   npx prisma db seed   # loads the Season 51 cast from prisma/seed.ts
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000 and log in with `SITE_PASSWORD` (participant) or
   `ADMIN_PASSWORD` (commissioner) from your `.env`.

## How it works

- **Everyone** logs in with the shared league password, picks a name on **My Team**, and drafts
  exactly 5 castaways, flagging one as their **Power Player**. Picks aren't exclusive — multiple
  teams can draft the same castaway.
- **The commissioner** logs in with the admin password and gets an **Admin** link in the nav:
  - **Manage Cast & Tribes** — add tribes, assign castaways to tribes, edit bios/photo URLs, and
    check a castaway off as voted out (draws the red X on the Cast page).
  - **Enter Weekly Scoring** — for each week, check who won a challenge and who survived tribal;
    points are computed automatically from the season's pre/post-merge rules. Set "merge week"
    once in Season Settings and everything after that week scores at post-merge rates. Final
    placements (1st/2nd/3rd) are entered the same way and drive the Power Player win bonus.
  - **Season Settings** — set the merge week, and lock the draft once the season is underway so
    participants can no longer change picks (admin can still edit after locking).
- The **Dashboard** and **Rules** pages are read-only and reflect the season's live scoring rules
  and standings — no rule values are hardcoded in the UI.

## Deploying to Vercel

1. Push this repo to GitHub and import it into a Vercel project (or `vercel link`).
2. Add a Postgres database from Vercel's Storage tab (Marketplace → Neon). This automatically
   sets both `DATABASE_URL` (pooled — used by the app at runtime) and `DATABASE_URL_UNPOOLED`
   (direct — used only for running migrations) as project env vars. No extra wiring needed.
3. Set `SITE_PASSWORD`, `ADMIN_PASSWORD`, and a fresh `SESSION_SECRET` in Vercel's environment
   variables — don't reuse the local dev values.
4. Deploy. The build runs `prisma migrate deploy` automatically (see `package.json`), so the
   schema is applied on every deploy — no manual migration step needed. Season/cast data isn't
   seeded automatically in production; add it via the admin UI (Manage Seasons → Manage Cast &
   Tribes) or copy it over from a local database dump.
