"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import type { Exercise, WorkoutExerciseWithDetails } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WorkoutExerciseRow {
  tempId: string;
  exercise_id: string;
  exercise: Exercise | null;
  sets: number;
  reps: number;
  weight_kg: number | null;
  rest_sec: number | null;
  order_index: number;
}

interface WorkoutFormProps {
  exercises: Exercise[];
  initialName?: string;
  initialExercises?: WorkoutExerciseWithDetails[];
  workoutId?: string;
}

export function WorkoutForm({
  exercises,
  initialName = "",
  initialExercises = [],
  workoutId,
}: WorkoutFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [rows, setRows] = useState<WorkoutExerciseRow[]>(
    initialExercises.length > 0
      ? initialExercises.map((we, i) => ({
          tempId: crypto.randomUUID(),
          exercise_id: we.exercise_id,
          exercise: we.exercise,
          sets: we.sets,
          reps: we.reps,
          weight_kg: we.weight_kg,
          rest_sec: we.rest_sec,
          order_index: i,
        }))
      : []
  );
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  function addExercise(ex: Exercise) {
    setRows((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        exercise_id: ex.id,
        exercise: ex,
        sets: 3,
        reps: 10,
        weight_kg: null,
        rest_sec: 60,
        order_index: prev.length,
      },
    ]);
    setShowPicker(false);
  }

  function removeRow(tempId: string) {
    setRows((prev) => prev.filter((r) => r.tempId !== tempId));
  }

  function updateRow(tempId: string, field: keyof WorkoutExerciseRow, value: number | null) {
    setRows((prev) =>
      prev.map((r) => (r.tempId === tempId ? { ...r, [field]: value } : r))
    );
  }

  function moveRow(tempId: string, direction: -1 | 1) {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.tempId === tempId);
      if (idx < 0) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim() || rows.length === 0) return;
    setSaving(true);

    try {
      const supabase = createClient();

      if (workoutId) {
        await supabase.from("workouts").update({ name }).eq("id", workoutId);
        await supabase.from("workout_exercises").delete().eq("workout_id", workoutId);
        await supabase.from("workout_exercises").insert(
          rows.map((r, i) => ({
            workout_id: workoutId,
            exercise_id: r.exercise_id,
            sets: r.sets,
            reps: r.reps,
            weight_kg: r.weight_kg,
            rest_sec: r.rest_sec,
            order_index: i,
          }))
        );
      } else {
        const { data: workout, error } = await supabase
          .from("workouts")
          .insert({ name })
          .select()
          .single();
        if (error) throw error;

        await supabase.from("workout_exercises").insert(
          rows.map((r, i) => ({
            workout_id: workout.id,
            exercise_id: r.exercise_id,
            sets: r.sets,
            reps: r.reps,
            weight_kg: r.weight_kg,
            rest_sec: r.rest_sec,
            order_index: i,
          }))
        );
      }

      router.push("/workouts");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Input
        id="workout-name"
        label={t.workouts.workoutName}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div
              key={row.tempId}
              className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">
                  {idx + 1}. {row.exercise?.name ?? "—"}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => moveRow(row.tempId, -1)}
                    disabled={idx === 0}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveRow(row.tempId, 1)}
                    disabled={idx === rows.length - 1}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeRow(row.tempId)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">{t.workouts.sets}</label>
                  <input
                    type="number"
                    min={1}
                    value={row.sets}
                    onChange={(e) => updateRow(row.tempId, "sets", parseInt(e.target.value) || 1)}
                    className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">{t.workouts.reps}</label>
                  <input
                    type="number"
                    min={1}
                    value={row.reps}
                    onChange={(e) => updateRow(row.tempId, "reps", parseInt(e.target.value) || 1)}
                    className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">{t.workouts.weight}</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={row.weight_kg ?? ""}
                    onChange={(e) =>
                      updateRow(row.tempId, "weight_kg", e.target.value ? parseFloat(e.target.value) : null)
                    }
                    className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">{t.workouts.rest}</label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={row.rest_sec ?? ""}
                    onChange={(e) =>
                      updateRow(row.tempId, "rest_sec", e.target.value ? parseInt(e.target.value) : null)
                    }
                    className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPicker ? (
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.workouts.addExercise}
            </span>
            <button
              onClick={() => setShowPicker(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => addExercise(ex)}
                className="block w-full rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {ex.name}
              </button>
            ))}
            {exercises.length === 0 && (
              <p className="py-2 text-center text-sm text-gray-500">
                {t.exercises.noExercises}
              </p>
            )}
          </div>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setShowPicker(true)} size="sm">
          + {t.workouts.addExercise}
        </Button>
      )}

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} loading={saving} disabled={!name.trim() || rows.length === 0}>
          {t.common.save}
        </Button>
        <Button variant="secondary" onClick={() => router.back()}>
          {t.common.cancel}
        </Button>
      </div>
    </div>
  );
}

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
