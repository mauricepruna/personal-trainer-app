"use client";

import Link from "next/link";
import type { Workout } from "@/lib/db/queries/workouts";

interface WorkoutCardProps {
  workout: Workout;
  onDelete: (id: string) => void;
}

export function WorkoutCard({ workout, onDelete }: WorkoutCardProps) {
  const exerciseCount = workout.exercises?.length ?? 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <Link href={`/workouts/${workout.id}`} className="flex-1">
          <h3 className="font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
            {workout.name}
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
          </p>
        </Link>
        <button
          onClick={() => onDelete(workout.id)}
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
      {workout.exercises && workout.exercises.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {workout.exercises
            .sort((a, b) => a.order_index - b.order_index)
            .map((we) => (
              <li key={we.id} className="text-sm text-gray-600 dark:text-gray-400">
                {we.exercise_name}: {we.sets}x{we.reps}
                {we.weight_kg ? ` @ ${we.weight_kg}kg` : ""}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
