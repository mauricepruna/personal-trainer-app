export type Phase = 1 | 2 | 3;

export interface PlannedExercise {
  key: string;         // matches exercise-images folder name
  name: string;
  sets: string;
  reps: string;
  startWeight: string;
  targetWeight: string;
  tip?: string;
  primaryMuscles: string[];
}

export interface WorkoutDay {
  id: string;
  label: string;
  dayOfWeek: string;
  type: "push" | "pull" | "lower" | "cardio";
  exercises: PlannedExercise[];
  cardioNote?: string;
  warmUp?: string[];
}

export const PHASES: Record<Phase, { label: string; weeks: string; rpe: string; rest: string }> = {
  1: { label: "Foundation", weeks: "Weeks 1–4", rpe: "RPE 6–7 (3–4 reps left in tank)", rest: "90–120 sec" },
  2: { label: "Build",       weeks: "Weeks 5–8", rpe: "RPE 7–8 (2–3 reps left in tank)", rest: "60–90 sec" },
  3: { label: "Push",        weeks: "Weeks 9–12", rpe: "RPE 8–9 (1–2 reps left in tank)", rest: "60 sec" },
};

// Per-phase weights for each exercise key
const weights: Record<string, Record<Phase, { sets: string; reps: string; start: string; target: string }>> = {
  "incline-db-press": {
    1: { sets: "3", reps: "10", start: "20 lb each", target: "30 lb" },
    2: { sets: "3", reps: "10", start: "30 lb each", target: "37.5 lb" },
    3: { sets: "4", reps: "10", start: "35 lb each", target: "45 lb" },
  },
  "flat-db-press": {
    1: { sets: "3", reps: "10", start: "25 lb each", target: "35 lb" },
    2: { sets: "3", reps: "12", start: "35 lb each", target: "42.5 lb" },
    3: { sets: "4", reps: "10", start: "42.5 lb each", target: "50 lb" },
  },
  "db-shoulder-press": {
    1: { sets: "3", reps: "10", start: "15 lb each", target: "22.5 lb" },
    2: { sets: "3", reps: "12", start: "22.5 lb each", target: "27.5 lb" },
    3: { sets: "4", reps: "10", start: "27.5 lb each", target: "32.5 lb" },
  },
  "lateral-raises": {
    1: { sets: "2", reps: "12", start: "10 lb each", target: "12.5 lb" },
    2: { sets: "3", reps: "12", start: "12.5 lb each", target: "15 lb" },
    3: { sets: "3", reps: "12", start: "15 lb each", target: "20 lb" },
  },
  "overhead-tricep-ext": {
    1: { sets: "3", reps: "12", start: "20 lb (single DB)", target: "27.5 lb" },
    2: { sets: "3", reps: "12", start: "27.5 lb", target: "35 lb" },
    3: { sets: "4", reps: "10", start: "35 lb", target: "40 lb" },
  },
  "goblet-squat": {
    1: { sets: "3", reps: "12", start: "30 lb KB", target: "45 lb" },
    2: { sets: "3", reps: "12", start: "45 lb KB", target: "55 lb" },
    3: { sets: "4", reps: "10", start: "55 lb KB", target: "65 lb" },
  },
  "bulgarian-split-squat": {
    1: { sets: "3", reps: "8 each", start: "15 lb DBs", target: "20 lb" },
    2: { sets: "3", reps: "10 each", start: "20 lb DBs", target: "27.5 lb" },
    3: { sets: "3", reps: "12 each", start: "27.5 lb DBs", target: "32.5 lb" },
  },
  "kb-swing": {
    1: { sets: "3", reps: "15", start: "25 lb KB", target: "35 lb" },
    2: { sets: "4", reps: "15", start: "35 lb KB", target: "50 lb" },
    3: { sets: "4", reps: "20", start: "50 lb KB", target: "60 lb" },
  },
  "calf-raises": {
    1: { sets: "3", reps: "15", start: "Bodyweight", target: "Hold 15 lb DB" },
    2: { sets: "3", reps: "15", start: "15 lb DB", target: "25 lb" },
    3: { sets: "4", reps: "15", start: "25 lb DB", target: "35 lb" },
  },
  "dead-bugs": {
    1: { sets: "3", reps: "10 each side", start: "Bodyweight", target: "Slower tempo" },
    2: { sets: "3", reps: "12 each side", start: "Bodyweight", target: "Slower tempo" },
    3: { sets: "3", reps: "15 each side", start: "Bodyweight", target: "Slower tempo" },
  },
  "plank": {
    1: { sets: "3", reps: "20 sec", start: "Bodyweight", target: "45 sec" },
    2: { sets: "3", reps: "30–45 sec", start: "Bodyweight", target: "60 sec" },
    3: { sets: "3", reps: "45–60 sec", start: "Bodyweight", target: "60+ sec" },
  },
  "pallof-press": {
    1: { sets: "3", reps: "10 each side", start: "Light band", target: "Medium band" },
    2: { sets: "3", reps: "12 each side", start: "Medium band", target: "Heavy band" },
    3: { sets: "3", reps: "15 each side", start: "Heavy band", target: "Heavy band" },
  },
  "chest-supported-row": {
    1: { sets: "3", reps: "10", start: "20 lb each", target: "27.5 lb" },
    2: { sets: "3", reps: "12", start: "27.5 lb each", target: "32.5 lb" },
    3: { sets: "4", reps: "10", start: "32.5 lb each", target: "37.5 lb" },
  },
  "single-arm-row": {
    1: { sets: "3", reps: "10 each", start: "25 lb", target: "32.5 lb" },
    2: { sets: "3", reps: "12 each", start: "32.5 lb", target: "37.5 lb" },
    3: { sets: "4", reps: "10 each", start: "37.5 lb", target: "42.5 lb" },
  },
  "band-pull-ups": {
    1: { sets: "3", reps: "3–5 reps", start: "Heaviest band", target: "5 reps" },
    2: { sets: "3", reps: "5–8 reps", start: "Medium band", target: "8 reps" },
    3: { sets: "3", reps: "6–10 reps", start: "Light band / negatives", target: "Unassisted" },
  },
  "wall-lean-lateral": {
    1: { sets: "2", reps: "12 each", start: "8 lb", target: "10 lb" },
    2: { sets: "3", reps: "12 each", start: "10 lb", target: "12.5 lb" },
    3: { sets: "3", reps: "15 each", start: "12.5 lb", target: "15 lb" },
  },
  "incline-db-curl": {
    1: { sets: "3", reps: "10", start: "12.5 lb", target: "15 lb" },
    2: { sets: "3", reps: "12", start: "15 lb", target: "20 lb" },
    3: { sets: "4", reps: "10", start: "20 lb", target: "25 lb" },
  },
  "db-preacher-curl": {
    1: { sets: "2", reps: "12", start: "10 lb", target: "12.5 lb" },
    2: { sets: "3", reps: "12", start: "12.5 lb", target: "15 lb" },
    3: { sets: "3", reps: "10", start: "15 lb", target: "20 lb" },
  },
  "romanian-deadlift": {
    1: { sets: "3", reps: "10", start: "25 lb each", target: "35 lb" },
    2: { sets: "3", reps: "12", start: "35 lb each", target: "42.5 lb" },
    3: { sets: "4", reps: "10", start: "42.5 lb each", target: "50 lb" },
  },
  "kb-sumo-deadlift": {
    1: { sets: "3", reps: "10", start: "40 lb KB", target: "50 lb" },
    2: { sets: "3", reps: "12", start: "50 lb KB", target: "60 lb" },
    3: { sets: "4", reps: "10", start: "60 lb KB", target: "70 lb" },
  },
  "reverse-lunge": {
    1: { sets: "3", reps: "8 each", start: "15 lb DBs", target: "20 lb" },
    2: { sets: "3", reps: "10 each", start: "20 lb DBs", target: "27.5 lb" },
    3: { sets: "3", reps: "12 each", start: "27.5 lb DBs", target: "32.5 lb" },
  },
  "sissy-squat": {
    1: { sets: "2", reps: "8", start: "Bodyweight", target: "Deeper range" },
    2: { sets: "3", reps: "10", start: "Bodyweight", target: "Hold 5–10 lb" },
    3: { sets: "3", reps: "12", start: "Hold light DB", target: "Add weight" },
  },
  "glute-bridges": {
    1: { sets: "2", reps: "12", start: "Bodyweight (warm-up)", target: "Bodyweight" },
    2: { sets: "2", reps: "15", start: "Bodyweight", target: "Bodyweight" },
    3: { sets: "3", reps: "15", start: "Bodyweight", target: "Bodyweight" },
  },
};

const tips: Record<string, string> = {
  "incline-db-press": "Align arm path with upper chest fibers — don't flare too wide",
  "flat-db-press": "Lower slowly (3 sec down), press explosively",
  "db-shoulder-press": "Tuck elbows at bottom, flare on the way up to protect shoulder",
  "lateral-raises": "Phase 2+: do full reps to failure, then go 20% heavier for half reps",
  "overhead-tricep-ext": "Keep elbows in, only forearms move",
  "goblet-squat": "Push knees out at bottom, chest tall throughout",
  "bulgarian-split-squat": "Wide stance = more glutes, narrow + knee forward = more quads",
  "kb-swing": "It's a hip hinge, NOT a squat — power from hips",
  "calf-raises": "Full stretch at bottom, 1-sec pause at top",
  "dead-bugs": "Flatten lower back to floor before moving limbs",
  "plank": "Body forms a straight line — no sagging hips",
  "pallof-press": "Brace core hard before pressing — resist rotation",
  "chest-supported-row": "Wide elbows for upper back, squeeze shoulder blades",
  "single-arm-row": "Sweep arm back toward hip for lat activation",
  "band-pull-ups": "Full dead hang at bottom, chin over bar at top",
  "wall-lean-lateral": "Lean away from wall — makes the bottom range harder",
  "incline-db-curl": "Arms hang behind body on the bench — don't swing",
  "db-preacher-curl": "Full stretch at bottom for maximum bicep growth",
  "romanian-deadlift": "Slow 3-sec descent, feel hamstring stretch",
  "kb-sumo-deadlift": "Wide stance, toes out, hinge then squat to grip",
  "reverse-lunge": "Step back (not forward) — easier on knees",
  "sissy-squat": "Lean back, core braced, knees track forward",
  "glute-bridges": "Squeeze glutes hard at top for 1 sec",
};

const warmUps: Record<string, string[]> = {
  "upper-a": [
    "Arm circles — 20 each direction",
    "Band pull-aparts — 15 reps",
    "Push-ups from knees — 2×8 (work toward full push-ups)",
  ],
  "lower-a": [
    "Bodyweight squats — 2×15",
    "Hip circles — 10 each leg",
    "Glute bridges — 2×12",
  ],
  "upper-b": [
    "Band pull-aparts — 15 reps",
    "Dead hangs from pull-up bar — 3×10–15 sec",
    "Scapular retractions (hang + shrug shoulders down) — 2×8",
  ],
  "lower-b": [
    "Hip hinges (bodyweight) — 2×10",
    "Leg swings — 10 each leg",
    "Glute bridges — 2×12",
  ],
};

function buildDay(
  id: string,
  label: string,
  dayOfWeek: string,
  type: WorkoutDay["type"],
  keys: string[],
  muscles: Record<string, string[]>,
  phase: Phase,
  cardioNote?: string
): WorkoutDay {
  return {
    id,
    label,
    dayOfWeek,
    type,
    cardioNote,
    warmUp: warmUps[id],
    exercises: keys.map((key) => {
      const w = weights[key]?.[phase] ?? { sets: "3", reps: "10", start: "—", target: "—" };
      return {
        key,
        name: getExerciseName(key),
        sets: w.sets,
        reps: w.reps,
        startWeight: w.start,
        targetWeight: w.target,
        tip: tips[key],
        primaryMuscles: muscles[key] ?? [],
      };
    }),
  };
}

function getExerciseName(key: string): string {
  const names: Record<string, string> = {
    "incline-db-press": "Incline DB Press",
    "flat-db-press": "Flat DB Press",
    "db-shoulder-press": "DB Shoulder Press",
    "lateral-raises": "Lateral Raises",
    "overhead-tricep-ext": "Overhead Tricep Extension",
    "goblet-squat": "Goblet Squat",
    "bulgarian-split-squat": "Bulgarian Split Squat",
    "kb-swing": "KB Swing",
    "calf-raises": "Calf Raises",
    "dead-bugs": "Dead Bugs",
    "plank": "Plank",
    "pallof-press": "Pallof Press",
    "chest-supported-row": "Chest-Supported Row",
    "single-arm-row": "Single-Arm DB Row",
    "band-pull-ups": "Band-Assisted Pull-ups",
    "wall-lean-lateral": "Wall-Lean Lateral Raise",
    "incline-db-curl": "Incline DB Curl",
    "db-preacher-curl": "DB Preacher Curl",
    "romanian-deadlift": "Romanian Deadlift",
    "kb-sumo-deadlift": "KB Sumo Deadlift",
    "reverse-lunge": "Reverse Lunge",
    "sissy-squat": "Sissy Squat",
    "glute-bridges": "Glute Bridges",
    "push-ups": "Push-ups",
  };
  return names[key] ?? key;
}

const muscleMap: Record<string, string[]> = {
  "incline-db-press": ["chest", "shoulders"],
  "flat-db-press": ["chest", "triceps"],
  "db-shoulder-press": ["shoulders", "triceps"],
  "lateral-raises": ["shoulders"],
  "overhead-tricep-ext": ["triceps"],
  "goblet-squat": ["quads", "glutes"],
  "bulgarian-split-squat": ["quads", "glutes", "hamstrings"],
  "kb-swing": ["glutes", "hamstrings", "core"],
  "calf-raises": ["calves"],
  "dead-bugs": ["core"],
  "plank": ["core"],
  "pallof-press": ["core"],
  "chest-supported-row": ["back", "biceps"],
  "single-arm-row": ["lats", "biceps"],
  "band-pull-ups": ["lats", "biceps"],
  "wall-lean-lateral": ["shoulders"],
  "incline-db-curl": ["biceps"],
  "db-preacher-curl": ["biceps"],
  "romanian-deadlift": ["hamstrings", "glutes"],
  "kb-sumo-deadlift": ["glutes", "hamstrings"],
  "reverse-lunge": ["quads", "glutes"],
  "sissy-squat": ["quads"],
  "glute-bridges": ["glutes"],
};

export function getPlanForPhase(phase: Phase): WorkoutDay[] {
  return [
    buildDay("upper-a", "Upper A — Push", "Tuesday", "push",
      ["incline-db-press", "flat-db-press", "db-shoulder-press", "lateral-raises", "overhead-tricep-ext"],
      muscleMap, phase),
    buildDay("lower-a", "Lower A — Quads & Glutes", "Wednesday", "lower",
      ["goblet-squat", "bulgarian-split-squat", "kb-swing", "calf-raises"],
      muscleMap, phase),
    buildDay("cardio", "Cardio + Core", "Thursday", "cardio",
      ["dead-bugs", "plank", "pallof-press"],
      muscleMap, phase,
      phase === 1 ? "20 min treadmill walk @ 3.0–3.5 mph, incline 2–3%"
        : phase === 2 ? "Intervals: 2 min walk / 1 min jog × 8 rounds"
        : "15 min continuous jog + 5 min cooldown walk"),
    buildDay("upper-b", "Upper B — Pull", "Friday", "pull",
      ["chest-supported-row", "single-arm-row", "band-pull-ups", "wall-lean-lateral", "incline-db-curl", "db-preacher-curl"],
      muscleMap, phase),
    buildDay("lower-b", "Lower B — Hamstrings & Posterior", "Saturday", "lower",
      ["romanian-deadlift", "kb-sumo-deadlift", "reverse-lunge", "sissy-squat", "glute-bridges"],
      muscleMap, phase),
    buildDay("easy-cardio", "Easy Cardio", "Sunday", "cardio",
      [],
      muscleMap, phase,
      phase === 1 ? "30 min brisk walk outdoors or treadmill (incline 3–5%)"
        : phase === 2 ? "35 min walk/jog intervals — 5 min walk / 3 min jog"
        : "30–40 min easy jog at conversational pace"),
  ];
}
