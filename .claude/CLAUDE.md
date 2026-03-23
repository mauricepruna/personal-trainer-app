# Personal Trainer App — Claude Code Context

## Project Overview
PWA (Progressive Web App) personal training app. Works on iOS, Android, and desktop from a single codebase. No App Store required — install via browser "Add to Home Screen".

## Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Charts:** Recharts or Chart.js
- **PWA:** next-pwa (service worker, offline support, installable)
- **State:** Zustand or React Query (TanStack)
- **Forms:** React Hook Form + Zod

## Project Structure (target)
```
app/
├── (auth)/
│   ├── login/
│   └── signup/
├── (app)/
│   ├── dashboard/
│   ├── exercises/          # Exercise library
│   ├── workouts/           # Workout builder & log
│   ├── calendar/           # Schedule sessions
│   ├── log/                # Daily log (weight + exercises)
│   ├── running/            # Running plans & log
│   ├── plan-generator/     # Generate plan by equipment
│   ├── progress/           # Charts & analytics
│   └── clients/            # Trainer: manage clients
├── api/                    # API routes (server actions)
└── layout.tsx

components/
├── ui/                     # Shared UI components
├── exercises/
├── workouts/
├── calendar/
├── charts/
└── body-map/               # SVG muscle group visualizer

lib/
├── supabase/               # Supabase client (browser + server)
├── hooks/                  # Custom React hooks
└── utils/

public/
├── manifest.json           # PWA manifest
└── icons/                  # App icons (all sizes)
```

## Database Schema (Supabase)
```sql
-- Users / profiles
profiles (id uuid PK, name text, role text CHECK (role IN ('user','trainer')), created_at timestamptz)

-- Equipment
equipment_types (id uuid PK, name text, icon text)
user_equipment (user_id uuid, equipment_id uuid)

-- Exercises
exercises (id uuid PK, name text, muscle_groups text[], equipment_id uuid, instructions text, video_url text)

-- Workouts
workouts (id uuid PK, user_id uuid, name text, created_at timestamptz)
workout_exercises (id uuid PK, workout_id uuid, exercise_id uuid, sets int, reps int, weight_kg float, rest_sec int, order_index int)

-- Sessions (calendar)
sessions (id uuid PK, user_id uuid, workout_id uuid, scheduled_at timestamptz, completed_at timestamptz, notes text)

-- Daily log
weight_log (id uuid PK, user_id uuid, date date, weight_kg float)
exercise_log (id uuid PK, user_id uuid, date date, exercise_id uuid, sets int, reps int, weight_kg float)

-- Running plans
running_plans (id uuid PK, name text, goal_distance_km float, weeks int, level text)
running_sessions (id uuid PK, plan_id uuid, week int, day int, type text, distance_km float, notes text)
running_log (id uuid PK, user_id uuid, date date, distance_km float, duration_sec int, pace_min_km float)

-- Client management
trainer_clients (trainer_id uuid, client_id uuid, assigned_at timestamptz)
```

## Feature Roadmap (GitHub Issues)
| # | Feature | Priority |
|---|---------|----------|
| #1 | PWA scaffold: Next.js + Supabase + auth | 🔴 P0 |
| #2 | Exercise library | 🔴 P0 |
| #3 | Workout builder & tracking | 🔴 P0 |
| #7 | Calendario de entrenamientos | 🟠 P1 |
| #8 | Log diario: ejercicios y peso corporal | 🟠 P1 |
| #9 | Generador de planes según equipo | 🟠 P1 |
| #10 | Planes de running por distancia | 🟠 P1 |
| #5 | Progress tracking & analytics | 🟡 P2 |
| #4 | Client management (trainer view) | 🟡 P2 |
| #6 | Android (native) — optional future | ⚪ P3 |

## UX Notes
- Muscle group visualization: SVG body map highlighting targeted muscles per exercise
- Equipment profiles: users save multiple profiles (Home, Gym, Traveling)
- Running log: distance, time, pace (min/km), RPE (1-10)
- Mobile-first design — optimized for phone use in the gym
- Dark mode support from day 1

## Development Rules
- **TypeScript strict mode** always
- **Server Components by default** — use `"use client"` only when needed
- **Supabase calls** go through `lib/supabase/` helpers, never raw in components
- **No hardcoded strings** — i18n-ready from day 1 (en/es)
- **Responsive:** mobile-first, works on tablet/desktop too

## Key Dependencies
```json
{
  "@supabase/supabase-js": "^2",
  "@supabase/ssr": "^0",
  "next-pwa": "^5",
  "recharts": "^2",
  "react-hook-form": "^7",
  "zod": "^3",
  "zustand": "^4",
  "tailwindcss": "^3"
}
```

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## GitHub
- Repo: https://github.com/mauricepruna/personal-trainer-app (private)
- Project board: https://github.com/users/mauricepruna/projects/2
- Main branch: `main`
- Feature branches: `feature/<issue-number>-<short-name>`
