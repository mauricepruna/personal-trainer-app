# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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

`lib/data/my-plan.ts` contains a static 12-week, 3-phase strength program (Push/Pull/Lower/Cardio split). It is **not** stored in the database — it is a data file exported as `getPlanForPhase(phase)`.

**Phase derivation** (in `lib/actions/plan.ts`):
```ts
currentPhase = Math.min(3, Math.floor(completedCount / 24) + 1)
currentWeek  = Math.min(12, Math.floor(completedCount / 6) + 1)
```
Phase advances on completed session count, not calendar date.

**Exercise keys** are kebab-case strings (e.g. `incline-db-press`). Exercise images are served from `public/exercise-images/<key>/`. When adding a new exercise key, create a matching folder under `public/exercise-images/` or the UI will render an empty image slot.

**Phase-aware exercise substitution:** Phases 2 and 3 substitute s-bar variants on Lower B and ab rollout on Cardio+Core. This is done via `lowerBKeys` / `cardioKeys` arrays branched by phase inside `getPlanForPhase`.

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
