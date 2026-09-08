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
  type: "push" | "pull" | "lower";
  exercises: PlannedExercise[];
  cardioNote?: string;
  optionalNote?: string;
  warmUp?: string[];
}

export const PHASES: Record<Phase, { label: string; weeks: string; rpe: string; rest: string }> = {
  1: { label: "Foundation", weeks: "Weeks 1–4", rpe: "RPE 6–7 (3–4 reps left in tank)", rest: "90–120 sec" },
  2: { label: "Build",       weeks: "Weeks 5–8", rpe: "RPE 7–8 (2–3 reps left in tank)", rest: "60–90 sec" },
  3: { label: "Push",        weeks: "Weeks 9–12", rpe: "RPE 8–9 (1–2 reps left in tank)", rest: "60 sec" },
};

// Per-phase weights for each exercise key
// All weights snapped to available Bowflex equipment:
//   KB 840: 8 / 12 / 20 / 25 / 35 / 40 lb (max 40 lb)
//   DB 552: 5 / 7.5 / 10 / 12.5 / 15 / 17.5 / 20 / 22.5 / 25 / 30 / 35 / 40 / 45 / 50 / 52.5 lb
// KB phases capped at 40 lb compensate with added reps or tempo progression.
const weights: Record<string, Record<Phase, { sets: string; reps: string; start: string; target: string }>> = {
  "incline-db-press": {
    1: { sets: "3", reps: "10", start: "20 lb each", target: "30 lb" },
    2: { sets: "3", reps: "10", start: "30 lb each", target: "35 lb" },
    3: { sets: "4", reps: "10", start: "40 lb each", target: "45 lb" },
  },
  "flat-db-press": {
    1: { sets: "3", reps: "10", start: "25 lb each", target: "35 lb" },
    2: { sets: "3", reps: "12", start: "35 lb each", target: "40 lb" },
    3: { sets: "4", reps: "10", start: "40 lb each", target: "50 lb" },
  },
  "db-shoulder-press": {
    1: { sets: "3", reps: "10", start: "15 lb each", target: "22.5 lb" },
    2: { sets: "3", reps: "12", start: "22.5 lb each", target: "30 lb" },
    3: { sets: "4", reps: "10", start: "30 lb each", target: "35 lb" },
  },
  "lateral-raises": {
    1: { sets: "2", reps: "12", start: "10 lb each", target: "12.5 lb" },
    2: { sets: "3", reps: "12", start: "12.5 lb each", target: "15 lb" },
    3: { sets: "3", reps: "12", start: "15 lb each", target: "20 lb" },
  },
  "overhead-tricep-ext": {
    1: { sets: "3", reps: "12", start: "20 lb (single DB)", target: "30 lb" },
    2: { sets: "3", reps: "12", start: "30 lb", target: "35 lb" },
    3: { sets: "4", reps: "10", start: "35 lb", target: "40 lb" },
  },
  "push-ups": {
    1: { sets: "2", reps: "6-10", start: "Incline or knee push-ups", target: "Full push-ups x10" },
    2: { sets: "3", reps: "8-12", start: "Full push-ups", target: "Controlled full push-ups x12" },
    3: { sets: "3", reps: "10-15", start: "Full push-ups", target: "Feet-elevated or slow eccentric" },
  },
  "goblet-squat": {
    1: { sets: "3", reps: "12", start: "25 lb KB", target: "35 lb" },
    2: { sets: "3", reps: "12", start: "35 lb KB", target: "40 lb" },
    3: { sets: "4", reps: "12", start: "40 lb KB", target: "40 lb KB, 3-sec eccentric" },
  },
  "bulgarian-split-squat": {
    1: { sets: "3", reps: "8 each", start: "15 lb DBs", target: "20 lb" },
    2: { sets: "3", reps: "10 each", start: "20 lb DBs", target: "30 lb" },
    3: { sets: "3", reps: "12 each", start: "30 lb DBs", target: "35 lb" },
  },
  "kb-swing": {
    1: { sets: "3", reps: "15", start: "25 lb KB", target: "35 lb" },
    2: { sets: "4", reps: "15", start: "35 lb KB", target: "40 lb" },
    3: { sets: "4", reps: "20", start: "40 lb KB", target: "40 lb KB, explosive hip drive" },
  },
  "calf-raises": {
    1: { sets: "3", reps: "12–15 each", start: "Bodyweight, hand support", target: "Hold 15 lb DB" },
    2: { sets: "3", reps: "12–15 each", start: "15 lb DB", target: "25 lb, slow 3-sec lower" },
    3: { sets: "4", reps: "12–15 each", start: "25 lb DB", target: "35 lb, 1-sec top pause" },
  },
  "chest-supported-row": {
    1: { sets: "3", reps: "10", start: "20 lb each", target: "30 lb" },
    2: { sets: "3", reps: "12", start: "30 lb each", target: "35 lb" },
    3: { sets: "4", reps: "10", start: "35 lb each", target: "40 lb" },
  },
  "single-arm-row": {
    1: { sets: "3", reps: "10 each", start: "25 lb", target: "30 lb" },
    2: { sets: "3", reps: "12 each", start: "30 lb", target: "40 lb" },
    3: { sets: "4", reps: "10 each", start: "40 lb", target: "45 lb" },
  },
  "band-pull-ups": {
    1: { sets: "3", reps: "3–5 reps", start: "Heaviest band", target: "5 reps" },
    2: { sets: "3", reps: "5–8 reps", start: "Medium band", target: "8 reps" },
    3: { sets: "3", reps: "6–10 reps", start: "Light band / negatives", target: "Unassisted" },
  },
  "wall-lean-lateral": {
    1: { sets: "2", reps: "12 each", start: "7.5 lb", target: "10 lb" },
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
  "kb-deadlift": {
    1: { sets: "3", reps: "10", start: "25 lb KB", target: "35 lb KB" },
    2: { sets: "3", reps: "12", start: "35 lb KB", target: "40 lb KB" },
    3: { sets: "4", reps: "10", start: "40 lb KB", target: "40 lb KB, 3-sec eccentric" },
  },
  "kb-one-arm-swing-clean": {
    1: { sets: "3", reps: "8 each", start: "12 lb KB", target: "20 lb KB" },
    2: { sets: "3", reps: "10 each", start: "20 lb KB", target: "25 lb KB" },
    3: { sets: "3", reps: "10 each", start: "25 lb KB", target: "30 lb KB, faster tempo" },
  },
  "kb-around-the-world": {
    1: { sets: "2", reps: "10 each direction", start: "12 lb KB", target: "20 lb KB" },
    2: { sets: "3", reps: "10 each direction", start: "20 lb KB", target: "25 lb KB" },
    3: { sets: "3", reps: "12 each direction", start: "25 lb KB", target: "30 lb KB, slower tempo" },
  },
  "kb-reverse-lunge": {
    1: { sets: "3", reps: "8 each", start: "20 lb KB", target: "30 lb KB" },
    2: { sets: "3", reps: "10 each", start: "30 lb KB", target: "35 lb KB" },
    3: { sets: "3", reps: "12 each", start: "35 lb KB", target: "40 lb KB" },
  },
};

const tips: Record<string, string> = {
  "incline-db-press": "Align arm path with upper chest fibers — don't flare too wide",
  "flat-db-press": "Lower slowly (3 sec down), press explosively",
  "db-shoulder-press": "Tuck elbows at bottom, flare on the way up to protect shoulder",
  "lateral-raises": "Phase 2+: do full reps to failure, then go 20% heavier for half reps",
  "overhead-tricep-ext": "Keep elbows in, only forearms move",
  "push-ups": "Keep ribs down and elbows about 45 degrees from your torso",
  "goblet-squat": "Push knees out at bottom, chest tall throughout",
  "bulgarian-split-squat": "Wide stance = more glutes, narrow + knee forward = more quads",
  "kb-swing": "It's a hip hinge, NOT a squat — power from hips",
  "calf-raises": "Use support for balance, move through the full ankle range",
  "chest-supported-row": "Chest down on the incline bench, row toward your hips, squeeze shoulder blades",
  "single-arm-row": "Sweep arm back toward hip for lat activation",
  "band-pull-ups": "Full dead hang at bottom, chin over bar at top",
  "wall-lean-lateral": "Lean away from wall — makes the bottom range harder",
  "incline-db-curl": "Arms hang behind body on the bench — don't swing",
  "db-preacher-curl": "Full stretch at bottom for maximum bicep growth",
  "kb-deadlift": "Hip hinge with the KB held in both hands in front of your thighs, soft knees, feel the hamstring stretch — squeeze glutes to stand tall (no shrug/clean at the top)",
  "kb-reverse-lunge": "Hold the KB at chest (goblet position), step back into a controlled lunge, drive through the front heel",
  "kb-one-arm-swing-clean": "Hike the KB back like a swing, then snap the hips forward and pull it straight to the rack position on one arm — let the bell float, don't muscle it up",
  "kb-around-the-world": "Circle the KB around your waist, passing it hand to hand — brace your core, stand tall, don't lean back",
};

const warmUps: Record<string, string[]> = {
  "push": [
    "Arm circles — 20 each direction",
    "Band pull-aparts — 15 reps",
    "Incline push-ups — 2x8 easy reps",
  ],
  "pull": [
    "Arm circles — 20 each direction",
    "Band pull-aparts — 15 reps",
    "Dead hangs from pull-up bar — 3×10–15 sec",
  ],
  "legs": [
    "Bodyweight squats — 2×15",
    "Hip circles — 10 each leg",
    "Banded lateral walks — 10 each direction",
    "Leg swings — 10 each leg",
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
  cardioNote?: string,
  optionalNote?: string
): WorkoutDay {
  return {
    id,
    label,
    dayOfWeek,
    type,
    cardioNote,
    optionalNote,
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
    "calf-raises": "Supported Single-Leg Calf Raise",
    "chest-supported-row": "Chest-Supported Row",
    "single-arm-row": "Single-Arm DB Row",
    "band-pull-ups": "Band-Assisted Pull-ups",
    "wall-lean-lateral": "Wall-Lean Lateral Raise",
    "incline-db-curl": "Incline DB Curl",
    "db-preacher-curl": "DB Preacher Curl",
    "kb-deadlift": "KB Deadlift",
    "kb-reverse-lunge": "KB Reverse Lunge",
    "kb-one-arm-swing-clean": "One-Arm KB Swing Clean",
    "kb-around-the-world": "KB Around the World",
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
  "push-ups": ["chest", "triceps"],
  "goblet-squat": ["quads", "glutes"],
  "bulgarian-split-squat": ["quads", "glutes", "hamstrings"],
  "kb-swing": ["glutes", "hamstrings", "core"],
  "calf-raises": ["calves"],
  "chest-supported-row": ["back", "biceps"],
  "single-arm-row": ["lats", "biceps"],
  "band-pull-ups": ["lats", "biceps"],
  "wall-lean-lateral": ["shoulders"],
  "incline-db-curl": ["biceps"],
  "db-preacher-curl": ["biceps"],
  "kb-deadlift": ["hamstrings", "glutes"],
  "kb-reverse-lunge": ["quads", "glutes"],
  "kb-one-arm-swing-clean": ["hamstrings", "glutes", "shoulders"],
  "kb-around-the-world": ["core", "shoulders"],
};

export function getPlanForPhase(phase: Phase): WorkoutDay[] {
  return [
    buildDay("push", "Push", "Monday", "push",
      ["incline-db-press", "flat-db-press", "push-ups", "db-shoulder-press", "lateral-raises", "overhead-tricep-ext"],
      muscleMap, phase),
    buildDay("pull", "Pull", "Wednesday", "pull",
      ["chest-supported-row", "single-arm-row", "band-pull-ups", "wall-lean-lateral", "incline-db-curl", "db-preacher-curl"],
      muscleMap, phase),
    buildDay("legs", "Legs", "Friday", "lower",
      ["goblet-squat", "kb-deadlift", "bulgarian-split-squat", "kb-reverse-lunge", "kb-swing", "kb-one-arm-swing-clean", "kb-around-the-world", "calf-raises"],
      muscleMap, phase),
  ];
}
