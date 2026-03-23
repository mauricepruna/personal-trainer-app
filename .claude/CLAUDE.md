# Personal Trainer App — Claude Code Context

## Project Overview
iOS-first personal training app built with SwiftUI and Supabase. Android is planned for later.

## Tech Stack
- **iOS:** Swift 5.9+, SwiftUI, iOS 16+
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Charts:** Swift Charts (native iOS 16+)
- **Architecture:** MVVM + Repository pattern
- **Package manager:** Swift Package Manager (SPM)

## Project Structure (target)
```
PersonalTrainer/
├── App/
│   └── PersonalTrainerApp.swift
├── Core/
│   ├── Supabase/         # Supabase client singleton
│   ├── Auth/             # Auth state, login/signup flows
│   └── Extensions/       # Swift/SwiftUI extensions
├── Features/
│   ├── Dashboard/        # Home screen
│   ├── ExerciseLibrary/  # Browse & search exercises
│   ├── WorkoutBuilder/   # Create & log workouts
│   ├── Calendar/         # Schedule & view sessions
│   ├── DailyLog/         # Daily weight + exercise log
│   ├── RunningPlans/     # 5K → marathon training plans
│   ├── PlanGenerator/    # AI-style plan generation by equipment
│   ├── Progress/         # Charts & analytics
│   └── Clients/          # Trainer: manage clients
├── Models/               # Shared data models (Codable)
├── Repositories/         # Data layer (Supabase calls)
└── Resources/            # Assets, localization
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
| #1 | iOS app scaffold: SwiftUI + Supabase + auth | 🔴 P0 |
| #2 | Exercise library | 🔴 P0 |
| #3 | Workout builder & tracking | 🔴 P0 |
| #7 | Calendario de entrenamientos | 🟠 P1 |
| #8 | Log diario: ejercicios y peso corporal | 🟠 P1 |
| #9 | Generador de planes según equipo | 🟠 P1 |
| #10 | Planes de running por distancia | 🟠 P1 |
| #5 | Progress tracking & analytics | 🟡 P2 |
| #4 | Client management (trainer view) | 🟡 P2 |
| #6 | Android implementation | ⚪ P3 |

## UX Notes
- Muscle group visualization: SVG body map that highlights targeted muscles per exercise
- Equipment profiles: users can save multiple profiles (Home, Gym, Traveling)
- Running log: distance, time, pace (min/km), RPE (1-10)

## Development Rules
- **Always use MVVM:** Views own no business logic
- **Repository pattern:** All Supabase calls go through a Repository class, never directly from ViewModels
- **DRY_RUN mode not applicable here** — but use Supabase local dev for testing when possible
- **No hardcoded strings:** Use LocalizedStringKey / Localizable.strings from day 1
- **Accessibility:** VoiceOver labels on all interactive elements
- **Dark mode:** Support from day 1

## Key Dependencies (SPM)
```swift
// Package.swift dependencies
.package(url: "https://github.com/supabase-community/supabase-swift", from: "2.0.0")
```

## Supabase Config
- Project URL and anon key → store in `Config.xcconfig` (gitignored)
- Never hardcode keys in source

## GitHub
- Repo: https://github.com/mauricepruna/personal-trainer-app (private)
- Project board: https://github.com/users/mauricepruna/projects/2
- Main branch: `main`
- Feature branches: `feature/<issue-number>-<short-name>`
