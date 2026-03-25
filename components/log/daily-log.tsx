"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import type { Exercise, ExerciseLog, WeightLog } from "@/lib/types/database";
import { Button } from "@/components/ui/button";

interface DailyLogProps {
  exercises: Exercise[];
  initialWeightLogs: WeightLog[];
  initialExerciseLogs: (ExerciseLog & { exercise: { name: string } | null })[];
  initialDate: string;
}

export function DailyLog({
  exercises,
  initialWeightLogs,
  initialExerciseLogs,
  initialDate,
}: DailyLogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [weightLogs, setWeightLogs] = useState(initialWeightLogs);
  const [exerciseLogs, setExerciseLogs] = useState(initialExerciseLogs);

  // Weight form
  const [weightKg, setWeightKg] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);

  // Exercise log form
  const [showExForm, setShowExForm] = useState(false);
  const [exId, setExId] = useState("");
  const [exSets, setExSets] = useState("3");
  const [exReps, setExReps] = useState("10");
  const [exWeight, setExWeight] = useState("");
  const [savingEx, setSavingEx] = useState(false);

  async function handleDateChange(newDate: string) {
    setDate(newDate);
    const supabase = createClient();
    const [wResult, eResult] = await Promise.all([
      supabase.from("weight_log").select("*").eq("date", newDate),
      supabase.from("exercise_log").select("*, exercise:exercises(name)").eq("date", newDate),
    ]);
    setWeightLogs(wResult.data ?? []);
    setExerciseLogs(eResult.data ?? []);
  }

  async function handleLogWeight() {
    if (!weightKg) return;
    setSavingWeight(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("weight_log")
        .insert({ date, weight_kg: parseFloat(weightKg) })
        .select()
        .single();
      if (error) throw error;
      setWeightLogs((prev) => [...prev, data]);
      setWeightKg("");
      router.refresh();
    } finally {
      setSavingWeight(false);
    }
  }

  async function handleLogExercise() {
    if (!exId) return;
    setSavingEx(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("exercise_log")
        .insert({
          date,
          exercise_id: exId,
          sets: parseInt(exSets),
          reps: parseInt(exReps),
          weight_kg: exWeight ? parseFloat(exWeight) : null,
        })
        .select("*, exercise:exercises(name)")
        .single();
      if (error) throw error;
      setExerciseLogs((prev) => [...prev, data]);
      setShowExForm(false);
      setExId("");
      setExSets("3");
      setExReps("10");
      setExWeight("");
      router.refresh();
    } finally {
      setSavingEx(false);
    }
  }

  async function deleteWeightLog(id: string) {
    const supabase = createClient();
    await supabase.from("weight_log").delete().eq("id", id);
    setWeightLogs((prev) => prev.filter((w) => w.id !== id));
    router.refresh();
  }

  async function deleteExerciseLog(id: string) {
    const supabase = createClient();
    await supabase.from("exercise_log").delete().eq("id", id);
    setExerciseLogs((prev) => prev.filter((e) => e.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.log.title}
        </h1>
        <input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      {/* Body weight section */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          {t.log.bodyWeight}
        </h2>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.1"
            placeholder={t.log.weightKg}
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <Button size="sm" onClick={handleLogWeight} loading={savingWeight} disabled={!weightKg}>
            {t.log.logWeight}
          </Button>
        </div>
        {weightLogs.length > 0 && (
          <ul className="mt-3 space-y-1">
            {weightLogs.map((w) => (
              <li key={w.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{w.weight_kg} kg</span>
                <button
                  onClick={() => deleteWeightLog(w.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Exercise log section */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.exercises.title}
          </h2>
          <Button size="sm" onClick={() => setShowExForm(true)}>
            + {t.log.logExercise}
          </Button>
        </div>

        {showExForm && (
          <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <select
              value={exId}
              onChange={(e) => setExId(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Select exercise...</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500">{t.workouts.sets}</label>
                <input
                  type="number"
                  min={1}
                  value={exSets}
                  onChange={(e) => setExSets(e.target.value)}
                  className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">{t.workouts.reps}</label>
                <input
                  type="number"
                  min={1}
                  value={exReps}
                  onChange={(e) => setExReps(e.target.value)}
                  className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">{t.workouts.weight}</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={exWeight}
                  onChange={(e) => setExWeight(e.target.value)}
                  className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleLogExercise} loading={savingEx} disabled={!exId}>
                {t.common.save}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowExForm(false)}>
                {t.common.cancel}
              </Button>
            </div>
          </div>
        )}

        {exerciseLogs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.log.noEntries}</p>
        ) : (
          <ul className="space-y-2">
            {exerciseLogs.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2 dark:border-gray-800">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {entry.exercise?.name ?? "—"}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    {entry.sets}x{entry.reps}
                    {entry.weight_kg ? ` @ ${entry.weight_kg}kg` : ""}
                  </span>
                </div>
                <button
                  onClick={() => deleteExerciseLog(entry.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
