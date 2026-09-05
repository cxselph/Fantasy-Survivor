# Fantasy Survivor League — Season 51

A small Next.js app for running the family/friends Fantasy Survivor League: password-gated
signup, team drafting, a commissioner admin area for weekly scoring, and a live standings
dashboard. Deployed on Vercel with a Neon Postgres database.

## Stack

- Next.js 16 (App Router) + Tailwind
- PostgreSQL via Prisma 7 (driver adapter: `@prisma/adapter-pg`)
- Real per-user accounts (email + password), admin-issued invites, cookie-based sessions

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
   Visit http://localhost:3000/setup and use `ADMIN_PASSWORD` from your `.env` to create the
   first real admin account (one-time — the setup page redirects to login once an admin exists).

## How it works

- **Admins** invite each participant by email from **Admin → Manage Users** (optionally linking
  the invite straight to an existing team). The invitee sets their own password via the emailed
  link and is logged in immediately.
- **Everyone** logs in with their own email/password and drafts exactly 5 castaways on **My
  Team**, flagging one as their **Power Player**. Picks aren't exclusive — multiple teams can
  draft the same castaway. Five failed login attempts locks an account for 15 minutes; an admin
  can unlock it early from Manage Users.
- **Admins** get an **Admin** link in the nav:
  - **Manage Cast & Tribes** — add tribes, assign castaways to tribes, edit bios/photo URLs, and
    check a castaway off as voted out (draws the red X on the Cast page).
  - **Enter Weekly Scoring** — for each week, check who won a challenge and who survived tribal;
    points are computed automatically from the season's pre/post-merge rules. Set "merge week"
    once in Season Settings and everything after that week scores at post-merge rates. Final
    placements (1st/2nd/3rd) are entered the same way and drive the Power Player win bonus.
  - **Season Settings** — set the merge week, and lock the draft once the season is underway so
    participants can no longer change picks (admin can still edit after locking).
  - **Manage Seasons** — create additional seasons and switch which one is active (only the
    active season is visible to participants), edit a season's name/number or delete it, and
    download/restore a full per-season backup (cast, tribes, teams, and scoring history) as a
    JSON file — restoring always creates a new season rather than overwriting one.
  - **Manage Teams** — view every team, unlock/delete one, or unlink it from its account, without
    needing to be that team's owner.
  - **Manage Users** / **Email Settings** — invite people, resend or edit a pending invite,
    disable/enable or delete an account, directly set a user's password (no email round-trip
    needed), and configure the SMTP provider used to send those invite emails.
- The **Dashboard** and **Rules** pages are read-only and reflect the season's live scoring rules
  and standings — no rule values are hardcoded in the UI.

## Deploying to Vercel

1. Push this repo to GitHub and import it into a Vercel project (or `vercel link`).
2. Add a Postgres database from Vercel's Storage tab (Marketplace → Neon). This automatically
   sets both `DATABASE_URL` (pooled — used by the app at runtime) and `DATABASE_URL_UNPOOLED`
   (direct — used only for running migrations) as project env vars. No extra wiring needed.
3. Set `ADMIN_PASSWORD`, `SESSION_SECRET`, and `SETTINGS_ENCRYPTION_KEY` in Vercel's environment
   variables (fresh values, don't reuse local dev's) — across Production, Preview, *and*
   Development scopes if PR previews or `vercel dev` are ever used, since they're independent.
4. Deploy. The build runs `prisma migrate deploy` automatically (see `package.json`), so the
   schema is applied on every deploy — no manual migration step needed. Season/cast data isn't
   seeded automatically in production; add it via the admin UI (Manage Seasons → Manage Cast &
   Tribes) or copy it over from a local database dump.
