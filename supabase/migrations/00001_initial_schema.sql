-- Equipment types
create table equipment_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text
);

-- Exercises
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_groups text[] not null default '{}',
  equipment_id uuid references equipment_types(id) on delete set null,
  instructions text,
  video_url text,
  created_by uuid references auth.users(id) on delete set null
);

-- Workouts
create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Workout exercises (join table)
create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  sets int not null default 3,
  reps int not null default 10,
  weight_kg float,
  rest_sec int,
  order_index int not null default 0
);

-- Sessions (calendar)
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  workout_id uuid references workouts(id) on delete cascade not null,
  scheduled_at timestamptz not null,
  completed_at timestamptz,
  notes text
);

-- Weight log
create table weight_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  date date not null default current_date,
  weight_kg float not null
);

-- Exercise log
create table exercise_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  date date not null default current_date,
  exercise_id uuid references exercises(id) on delete cascade not null,
  sets int not null,
  reps int not null,
  weight_kg float
);

-- Running plans
create table running_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  goal_distance_km float not null,
  weeks int not null,
  level text not null
);

-- Running sessions
create table running_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references running_plans(id) on delete cascade not null,
  week int not null,
  day int not null,
  type text not null,
  distance_km float,
  notes text
);

-- Running log
create table running_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  date date not null default current_date,
  distance_km float not null,
  duration_sec int not null,
  pace_min_km float
);

-- Profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text not null default 'user' check (role in ('user', 'trainer')),
  created_at timestamptz not null default now()
);

-- Trainer-client relationships
create table trainer_clients (
  trainer_id uuid references profiles(id) on delete cascade not null,
  client_id uuid references profiles(id) on delete cascade not null,
  assigned_at timestamptz not null default now(),
  primary key (trainer_id, client_id)
);

-- User equipment
create table user_equipment (
  user_id uuid references auth.users(id) on delete cascade not null,
  equipment_id uuid references equipment_types(id) on delete cascade not null,
  primary key (user_id, equipment_id)
);

-- RLS policies
alter table equipment_types enable row level security;
alter table exercises enable row level security;
alter table workouts enable row level security;
alter table workout_exercises enable row level security;
alter table sessions enable row level security;
alter table weight_log enable row level security;
alter table exercise_log enable row level security;
alter table running_plans enable row level security;
alter table running_sessions enable row level security;
alter table running_log enable row level security;
alter table profiles enable row level security;
alter table trainer_clients enable row level security;
alter table user_equipment enable row level security;

-- Equipment types: readable by all authenticated users
create policy "Equipment types are viewable by authenticated users"
  on equipment_types for select to authenticated using (true);

-- Exercises: readable by all authenticated, writable by creator
create policy "Exercises are viewable by authenticated users"
  on exercises for select to authenticated using (true);

create policy "Users can create exercises"
  on exercises for insert to authenticated with check (true);

create policy "Users can update own exercises"
  on exercises for update to authenticated using (created_by = auth.uid());

create policy "Users can delete own exercises"
  on exercises for delete to authenticated using (created_by = auth.uid());

-- Workouts: user owns their workouts
create policy "Users can view own workouts"
  on workouts for select to authenticated using (user_id = auth.uid());

create policy "Users can create workouts"
  on workouts for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update own workouts"
  on workouts for update to authenticated using (user_id = auth.uid());

create policy "Users can delete own workouts"
  on workouts for delete to authenticated using (user_id = auth.uid());

-- Workout exercises: accessible if user owns the workout
create policy "Users can view own workout exercises"
  on workout_exercises for select to authenticated
  using (workout_id in (select id from workouts where user_id = auth.uid()));

create policy "Users can manage own workout exercises"
  on workout_exercises for insert to authenticated
  with check (workout_id in (select id from workouts where user_id = auth.uid()));

create policy "Users can update own workout exercises"
  on workout_exercises for update to authenticated
  using (workout_id in (select id from workouts where user_id = auth.uid()));

create policy "Users can delete own workout exercises"
  on workout_exercises for delete to authenticated
  using (workout_id in (select id from workouts where user_id = auth.uid()));

-- Sessions
create policy "Users can view own sessions"
  on sessions for select to authenticated using (user_id = auth.uid());

create policy "Users can create sessions"
  on sessions for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update own sessions"
  on sessions for update to authenticated using (user_id = auth.uid());

create policy "Users can delete own sessions"
  on sessions for delete to authenticated using (user_id = auth.uid());

-- Weight log
create policy "Users can view own weight log"
  on weight_log for select to authenticated using (user_id = auth.uid());

create policy "Users can create weight log"
  on weight_log for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update own weight log"
  on weight_log for update to authenticated using (user_id = auth.uid());

create policy "Users can delete own weight log"
  on weight_log for delete to authenticated using (user_id = auth.uid());

-- Exercise log
create policy "Users can view own exercise log"
  on exercise_log for select to authenticated using (user_id = auth.uid());

create policy "Users can create exercise log"
  on exercise_log for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update own exercise log"
  on exercise_log for update to authenticated using (user_id = auth.uid());

create policy "Users can delete own exercise log"
  on exercise_log for delete to authenticated using (user_id = auth.uid());

-- Running plans & sessions: readable by all authenticated
create policy "Running plans are viewable by authenticated users"
  on running_plans for select to authenticated using (true);

create policy "Running sessions are viewable by authenticated users"
  on running_sessions for select to authenticated using (true);

-- Running log
create policy "Users can view own running log"
  on running_log for select to authenticated using (user_id = auth.uid());

create policy "Users can create running log"
  on running_log for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update own running log"
  on running_log for update to authenticated using (user_id = auth.uid());

create policy "Users can delete own running log"
  on running_log for delete to authenticated using (user_id = auth.uid());

-- Profiles
create policy "Users can view own profile"
  on profiles for select to authenticated using (id = auth.uid());

create policy "Users can update own profile"
  on profiles for update to authenticated using (id = auth.uid());

create policy "Users can insert own profile"
  on profiles for insert to authenticated with check (id = auth.uid());

-- User equipment
create policy "Users can view own equipment"
  on user_equipment for select to authenticated using (user_id = auth.uid());

create policy "Users can manage own equipment"
  on user_equipment for insert to authenticated with check (user_id = auth.uid());

create policy "Users can delete own equipment"
  on user_equipment for delete to authenticated using (user_id = auth.uid());

-- Trainer clients
create policy "Trainers can view own clients"
  on trainer_clients for select to authenticated using (trainer_id = auth.uid());

create policy "Trainers can manage clients"
  on trainer_clients for insert to authenticated with check (trainer_id = auth.uid());

create policy "Trainers can remove clients"
  on trainer_clients for delete to authenticated using (trainer_id = auth.uid());

-- Seed equipment types
insert into equipment_types (name, icon) values
  ('Barbell', 'barbell'),
  ('Dumbbell', 'dumbbell'),
  ('Kettlebell', 'kettlebell'),
  ('Cable Machine', 'cable'),
  ('Resistance Band', 'band'),
  ('Pull-up Bar', 'pullup-bar'),
  ('Bench', 'bench'),
  ('Smith Machine', 'smith'),
  ('Bodyweight', 'bodyweight'),
  ('TRX / Suspension', 'trx'),
  ('Medicine Ball', 'med-ball'),
  ('EZ Bar', 'ez-bar');
