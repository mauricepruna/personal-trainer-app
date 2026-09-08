# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # dev server on localhost:3000
npm run dev:network   # dev server exposed on 0.0.0.0:3000 (for mobile testing)
npm run lint          # ESLint via next lint
npm run build         # production build (verifies TS + lint)
npx tsc --noEmit      # type-check without emitting
```

No test suite is configured.

### Background dev server (macOS)

The dev server can run as a launchd service that starts at login and restarts on crash:

```bash
launchctl load ~/Library/LaunchAgents/com.personal-trainer-app.dev.plist    # start
launchctl unload ~/Library/LaunchAgents/com.personal-trainer-app.dev.plist  # stop
launchctl list | grep personal-trainer                                        # status
tail -f ~/Library/Logs/personal-trainer-app.log                              # logs
```

## Architecture

### Tech Stack

- **Next.js 14** App Router, TypeScript strict, Tailwind CSS
- **Database:** SQLite via `better-sqlite3` — file at `data/app.db`, created automatically on first run
- **Auth:** JWT in an httpOnly cookie (`auth-session`), signed with `jose`. No Supabase (README.md is stale — ignore it).
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **State:** Zustand (client)
- **PWA:** next-pwa (service worker, manifest)
- **i18n:** client-side only, `en`/`es` dictionaries in `lib/i18n/dictionaries/`
- **Deployed on:** Coolify (self-hosted VPS). SQLite persists via a mounted Docker volume — verify `data/` is mapped to a persistent volume in Coolify's Storages tab.

### Request / Data Flow

```
RSC page → lib/db/queries/<domain>.ts   (reads, server-side)
         → lib/actions/<domain>.ts       (mutations, "use server")
           ↓
         lib/db/index.ts (getDb singleton) → data/app.db
```

- **Pages** (`app/(app)/*/page.tsx`) are Server Components — they call query helpers directly.
- **Mutations** go through Server Actions in `lib/actions/`. Every action calls `getSession()` first and redirects to `/login` if unauthenticated.
- **Components** under `components/<domain>/` are client components that receive data as props and call Server Actions for mutations.

### Auth

- `lib/auth/session.ts` — `createSession`, `getSession`, `deleteSession`. JWT expires in 30 days.
- `lib/auth/actions.ts` — `loginAction`, `signupAction`, `logoutAction` (Server Actions).
- Route guard: `app/(app)/layout.tsx` calls `getSession()` and redirects to `/login` on failure.
- `JWT_SECRET` env var controls signing key (defaults to a dev placeholder if unset).

### Database

- Schema is defined inline in `lib/db/index.ts` (`initSchema`) — `CREATE TABLE IF NOT EXISTS` on every cold start. No migration files.
- `muscle_groups` column on `exercises` is stored as a JSON string (`TEXT`), not an array.
- `user_settings` table holds per-user plan start date.

### My Plan (Hardcoded Program)

`lib/data/my-plan.ts` contains a static 12-week, 3-phase strength program — a 3-day Push/Pull/Legs split (Mon/Wed/Fri). It is **not** stored in the database — it is a data file exported as `getPlanForPhase(phase)`. Running is handled by a separate app, so no cardio days are scheduled here.

**Phase derivation** (in `lib/actions/plan.ts`), based on 3 sessions/week:
```ts
currentPhase = Math.min(3, Math.floor(completedCount / 12) + 1)
currentWeek  = Math.min(12, Math.floor(completedCount / 3) + 1)
```
Phase advances on completed session count, not calendar date. Sessions are scheduled on offsets `[0, 2, 4]` days from the start of each week (`DAY_OFFSETS` in `lib/actions/plan.ts`) — i.e. Mon/Wed/Fri if the plan start date is a Monday.

**Exercise keys** are kebab-case strings (e.g. `incline-db-press`). Exercise images are served from `public/exercise-images/<key>/`. When adding a new exercise key, create a matching folder under `public/exercise-images/` or the UI will render an empty image slot.

**Legs day is KB-heavy by design** — it merges what used to be two separate lower-body days, so most of its exercises (`kb-deadlift`, `kb-reverse-lunge`, `kb-swing`, `goblet-squat`) use the kettlebell rather than dumbbells. The user owns a single adjustable KB (Bowflex 840, 8–40 lb) — never write an exercise or weight table assuming two kettlebells.

### i18n

- `LocaleProvider` in `lib/i18n/context.tsx` wraps the entire app (in `app/layout.tsx`).
- Use `useTranslation()` hook in client components to get `{ t, locale, setLocale }`.
- Dictionaries: `lib/i18n/dictionaries/en.json` and `es.json`.
- Server Components cannot use `useTranslation()` — pass translated strings as props if needed.

## Development Rules

- **Server Components by default** — `"use client"` only when hooks or browser APIs are needed.
- **DB access** only through `lib/db/` — never call `getDb()` directly in components or pages.
- **All mutations** must go through Server Actions (`"use server"`), never raw fetch calls to API routes.
- **No hardcoded user-facing strings** — add keys to both `en.json` and `es.json`.

## Environment Variables

```env
JWT_SECRET=   # Required in production. Dev falls back to an insecure placeholder.
```

## GitHub

- Repo: https://github.com/mauricepruna/personal-trainer-app (private)
- Issue board: https://github.com/users/mauricepruna/projects/4
- Main branch: `main`
- Feature branches: `feature/<issue-number>-<short-name>`
