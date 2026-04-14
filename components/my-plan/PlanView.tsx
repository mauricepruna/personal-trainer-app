"use client";

import { useState } from "react";
import Image from "next/image";
import { getPlanForPhase, PHASES, type Phase, type WorkoutDay, type PlannedExercise } from "@/lib/data/my-plan";

const PHASE_COLORS: Record<Phase, { bg: string; text: string; border: string; badge: string }> = {
  1: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800", badge: "bg-blue-600" },
  2: { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800", badge: "bg-violet-600" },
  3: { bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800", badge: "bg-orange-500" },
};

const DAY_TYPE_COLORS: Record<WorkoutDay["type"], string> = {
  push:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  pull:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  lower:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cardio: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
};

export function PlanView() {
  const [phase, setPhase] = useState<Phase>(1);
  const [activeDay, setActiveDay] = useState<string>("upper-a");
  const days = getPlanForPhase(phase);
  const selectedDay = days.find((d) => d.id === activeDay) ?? days[0];
  const colors = PHASE_COLORS[phase];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My 12-Week Plan</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Apr 14 – Jul 5, 2026 · 6 days/week · Upper/Lower split
        </p>
      </div>

      {/* Phase selector */}
      <div className="grid grid-cols-3 gap-3">
        {([1, 2, 3] as Phase[]).map((p) => {
          const c = PHASE_COLORS[p];
          const active = phase === p;
          return (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                active ? `${c.bg} ${c.border} ${c.text}` : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${active ? c.badge : "bg-gray-300 dark:bg-gray-600"}`} />
                <span className="text-xs font-semibold uppercase tracking-wide">{PHASES[p].label}</span>
              </div>
              <p className="mt-1 text-xs opacity-75">{PHASES[p].weeks}</p>
            </button>
          );
        })}
      </div>

      {/* Phase info */}
      <div className={`rounded-xl border p-4 ${colors.bg} ${colors.border}`}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className={`font-medium ${colors.text}`}>🎯 {PHASES[phase].rpe}</span>
          <span className={`${colors.text} opacity-80`}>⏱ Rest: {PHASES[phase].rest}</span>
          {phase === 3 && <span className={`${colors.text} opacity-80`}>⚡ Use pre-exhaust on press days</span>}
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((day) => (
          <button
            key={day.id}
            onClick={() => setActiveDay(day.id)}
            className={`flex-shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              activeDay === day.id
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            <span className="block text-[10px] opacity-60">{day.dayOfWeek}</span>
            {day.label.split(" — ")[0]}
          </button>
        ))}
      </div>

      {/* Selected day */}
      <DayView day={selectedDay} phase={phase} />
    </div>
  );
}

function DayView({ day, phase }: { day: WorkoutDay; phase: Phase }) {
  const colors = PHASE_COLORS[phase];

  return (
    <div className="space-y-4">
      {/* Day header */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{day.label}</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DAY_TYPE_COLORS[day.type]}`}>
          {day.dayOfWeek}
        </span>
      </div>

      {/* Cardio note */}
      {day.cardioNote && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800/50 dark:bg-yellow-950/30">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">🏃 {day.cardioNote}</p>
        </div>
      )}

      {/* Exercises */}
      {day.exercises.length > 0 ? (
        <div className="space-y-4">
          {day.exercises.map((ex, i) => (
            <ExerciseCard key={ex.key} exercise={ex} index={i} colors={colors} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">Cardio only — no strength work today</p>
        </div>
      )}
    </div>
  );
}

function ExerciseCard({
  exercise,
  index,
  colors,
}: {
  exercise: PlannedExercise;
  index: number;
  colors: { bg: string; text: string; border: string; badge: string };
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const imgSrc = `/exercise-images/${exercise.key}/${imgIndex}.jpg`;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex gap-4 p-4">
        {/* Image */}
        <button
          onClick={() => setImgIndex((i) => (i === 0 ? 1 : 0))}
          className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
          title="Tap to see other position"
        >
          <Image
            src={imgSrc}
            alt={exercise.name}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="96px"
          />
          <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1 text-[9px] text-white">
            {imgIndex === 0 ? "START" : "END"}
          </span>
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className={`text-xs font-bold ${colors.text}`}>#{index + 1}</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">{exercise.name}</h3>
            </div>
          </div>

          {/* Muscles */}
          <div className="mt-1 flex flex-wrap gap-1">
            {exercise.primaryMuscles.map((m) => (
              <span key={m} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400 capitalize">
                {m}
              </span>
            ))}
          </div>

          {/* Sets / reps / weight */}
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Stat label="Sets" value={exercise.sets} />
            <Stat label="Reps" value={exercise.reps} />
            <Stat label="Start" value={exercise.startWeight} small />
          </div>
        </div>
      </div>

      {/* Target + Tip expandable */}
      <div className="border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-2 text-left text-xs text-gray-500 hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-800/50"
        >
          <span>Target by phase end: <strong className="text-gray-700 dark:text-gray-300">{exercise.targetWeight}</strong></span>
          <ChevronIcon expanded={expanded} />
        </button>
        {expanded && exercise.tip && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-800 dark:text-gray-200">💡 Tip: </span>
              {exercise.tip}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 px-2 py-1.5 dark:bg-gray-800">
      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`font-semibold text-gray-900 dark:text-white ${small ? "text-xs" : "text-sm"}`}>{value}</p>
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
