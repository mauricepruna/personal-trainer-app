"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import type { EquipmentType, Exercise, MuscleGroup } from "@/lib/types/database";
import { Button } from "@/components/ui/button";

type Goal = "strength" | "hypertrophy" | "endurance";

interface PlanGeneratorProps {
  equipment: EquipmentType[];
  exercises: Exercise[];
}

interface GeneratedDay {
  name: string;
  exercises: {
    exercise: Exercise;
    sets: number;
    reps: number;
    rest_sec: number;
  }[];
}

const GOAL_PARAMS: Record<Goal, { sets: number; reps: number; rest: number }> = {
  strength: { sets: 5, reps: 5, rest: 180 },
  hypertrophy: { sets: 4, reps: 10, rest: 90 },
  endurance: { sets: 3, reps: 15, rest: 45 },
};

const MUSCLE_SPLIT: Record<number, string[][]> = {
  2: [["chest", "shoulders", "triceps", "core"], ["back", "biceps", "quads", "hamstrings", "glutes", "calves"]],
  3: [["chest", "shoulders", "triceps"], ["back", "biceps", "forearms"], ["quads", "hamstrings", "glutes", "calves", "core"]],
  4: [["chest", "triceps"], ["back", "biceps"], ["shoulders", "core", "forearms"], ["quads", "hamstrings", "glutes", "calves"]],
  5: [["chest"], ["back"], ["shoulders", "core"], ["quads", "glutes"], ["hamstrings", "calves", "biceps", "triceps"]],
};

export function PlanGenerator({ equipment, exercises }: PlanGeneratorProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [goal, setGoal] = useState<Goal>("hypertrophy");
  const [plan, setPlan] = useState<GeneratedDay[] | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleEquipment(id: string) {
    setSelectedEquipment((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function generatePlan() {
    if (selectedEquipment.size === 0) return;

    const availableExercises = exercises.filter(
      (ex) => !ex.equipment_id || selectedEquipment.has(ex.equipment_id)
    );

    const split = MUSCLE_SPLIT[daysPerWeek] ?? MUSCLE_SPLIT[3];
    const params = GOAL_PARAMS[goal];
    const dayNames = ["Day A", "Day B", "Day C", "Day D", "Day E"];

    const days: GeneratedDay[] = split.map((muscles, i) => {
      const dayExercises = muscles.flatMap((muscle) => {
        const matching = availableExercises.filter((ex) =>
          ex.muscle_groups.includes(muscle as MuscleGroup)
        );
        // Pick up to 2 exercises per muscle group
        return matching.slice(0, 2);
      });

      // Deduplicate
      const seen = new Set<string>();
      const unique = dayExercises.filter((ex) => {
        if (seen.has(ex.id)) return false;
        seen.add(ex.id);
        return true;
      });

      return {
        name: dayNames[i] ?? `Day ${i + 1}`,
        exercises: unique.slice(0, 6).map((ex) => ({
          exercise: ex,
          sets: params.sets,
          reps: params.reps,
          rest_sec: params.rest,
        })),
      };
    });

    setPlan(days);
  }

  async function saveAsWorkout(day: GeneratedDay) {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: workout, error } = await supabase
        .from("workouts")
        .insert({ name: day.name })
        .select()
        .single();
      if (error) throw error;

      await supabase.from("workout_exercises").insert(
        day.exercises.map((item, i) => ({
          workout_id: workout.id,
          exercise_id: item.exercise.id,
          sets: item.sets,
          reps: item.reps,
          rest_sec: item.rest_sec,
          order_index: i,
        }))
      );

      router.push("/workouts");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t.planGenerator.title}
      </h1>

      {/* Equipment selection */}
      <div>
        <h2 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.planGenerator.selectEquipment}
        </h2>
        <div className="flex flex-wrap gap-2">
          {equipment.map((eq) => {
            const selected = selectedEquipment.has(eq.id);
            return (
              <button
                key={eq.id}
                onClick={() => toggleEquipment(eq.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {eq.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Config */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.planGenerator.daysPerWeek}
          </label>
          <select
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.planGenerator.goal}
          </label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as Goal)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="strength">{t.planGenerator.goals.strength}</option>
            <option value="hypertrophy">{t.planGenerator.goals.hypertrophy}</option>
            <option value="endurance">{t.planGenerator.goals.endurance}</option>
          </select>
        </div>
      </div>

      <Button onClick={generatePlan} disabled={selectedEquipment.size === 0}>
        {t.planGenerator.generatePlan}
      </Button>

      {selectedEquipment.size === 0 && (
        <p className="text-sm text-gray-500">{t.planGenerator.noEquipment}</p>
      )}

      {/* Generated plan */}
      {plan && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.planGenerator.generatedPlan}
          </h2>
          {plan.map((day, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">{day.name}</h3>
                <Button size="sm" variant="secondary" onClick={() => saveAsWorkout(day)} loading={saving}>
                  {t.planGenerator.savePlan}
                </Button>
              </div>
              {day.exercises.length === 0 ? (
                <p className="text-sm text-gray-500">No matching exercises found</p>
              ) : (
                <ul className="space-y-1">
                  {day.exercises.map((item, j) => (
                    <li key={j} className="text-sm text-gray-700 dark:text-gray-300">
                      {item.exercise.name} — {item.sets}x{item.reps}, {item.rest_sec}s rest
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
