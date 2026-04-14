"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { deleteWorkoutAction } from "@/lib/actions/workouts";
import type { Workout } from "@/lib/db/queries/workouts";
import type { Exercise } from "@/lib/db/queries/exercises";
import { WorkoutCard } from "./workout-card";
import { Button } from "@/components/ui/button";

interface WorkoutListProps {
  initialWorkouts: Workout[];
  exercises: Exercise[];
}

export function WorkoutList({ initialWorkouts }: WorkoutListProps) {
  const { t } = useTranslation();
  const [workouts, setWorkouts] = useState(initialWorkouts);

  async function handleDelete(id: string) {
    if (!confirm(t.workouts.deleteConfirm)) return;
    await deleteWorkoutAction(id);
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t.workouts.title}
        </h1>
        <Link href="/workouts/new">
          <Button size="sm">+ {t.workouts.addWorkout}</Button>
        </Link>
      </div>

      {workouts.length === 0 ? (
        <p className="py-8 text-center text-gray-500 dark:text-gray-400">
          {t.workouts.noWorkouts}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
