"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { getPlanForPhase, PHASES, type Phase, type WorkoutDay, type PlannedExercise } from "@/lib/data/my-plan";
import { markPlanDayCompleteAction } from "@/lib/actions/calendar";
import type { PlanStatus } from "@/lib/actions/plan";

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

const PHASE_REST: Record<Phase, number[]> = {
  1: [90, 120],
  2: [60, 90],
  3: [60, 75],
};

// ── Alarm ────────────────────────────────────────────────────────────────────
// iOS Safari suspends AudioContext outside user gestures and won't resume it
// programmatically. The fix: pre-schedule alarm tones on the Web Audio timeline
// during the user gesture (Start button tap), using absolute ctx.currentTime
// offsets. The internal clock fires them regardless of JS callback timing.
let sharedAudioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedAudioCtx) sharedAudioCtx = new AudioContext();
    if (sharedAudioCtx.state === "suspended") sharedAudioCtx.resume();
    return sharedAudioCtx;
  } catch { return null; }
}

// Returns the OscillatorNode so callers can cancel early.
function scheduleTone(
  ctx: AudioContext,
  freq: number,
  atTime: number,
  duration: number,
  volume = 0.4,
): OscillatorNode {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, atTime);
  gain.gain.exponentialRampToValueAtTime(0.001, atTime + duration);
  osc.start(atTime);
  osc.stop(atTime + duration);
  return osc;
}

// Schedule alarm tones `delaySecs` seconds from now. Returns nodes to cancel.
function scheduleAlarm(ctx: AudioContext, delaySecs: number): OscillatorNode[] {
  const t = ctx.currentTime + delaySecs;
  return [
    scheduleTone(ctx, 880,  t,        0.15),
    scheduleTone(ctx, 1100, t + 0.2,  0.15),
    scheduleTone(ctx, 1320, t + 0.4,  0.3),
  ];
}

// Immediate playback — for non-timer use or desktop fallback.
function playAlarmNow(ctx: AudioContext) {
  scheduleAlarm(ctx, 0);
}

function playSuccess() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    scheduleTone(ctx, 523,  t,        0.12, 0.35);
    scheduleTone(ctx, 659,  t + 0.14, 0.12, 0.35);
    scheduleTone(ctx, 784,  t + 0.28, 0.12, 0.35);
    scheduleTone(ctx, 1047, t + 0.42, 0.3,  0.35);
  } catch { /* old browser */ }
}

// ── Rest Timer ───────────────────────────────────────────────────────────────
const TIMER_STORAGE_KEY = "rest-timer";

function saveTimerState(endTime: number, secs: number) {
  try { localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ endTime, secs })); } catch {}
}
function clearTimerState() {
  try { localStorage.removeItem(TIMER_STORAGE_KEY); } catch {}
}
function loadTimerState(): { endTime: number; secs: number } | null {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return null;
    const { endTime, secs } = JSON.parse(raw);
    if (typeof endTime !== "number" || typeof secs !== "number") return null;
    if (endTime <= Date.now()) { clearTimerState(); return null; }
    return { endTime, secs };
  } catch { return null; }
}

function RestTimer({ phase }: { phase: Phase }) {
  const presets = PHASE_REST[phase];
  const [seconds, setSeconds] = useState<number>(presets[0]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scheduledNodesRef = useRef<OscillatorNode[]>([]);
  const endTimeRef = useRef<number | null>(null);
  const isRunning = remaining !== null && remaining > 0;

  const cancelScheduledAlarm = useCallback(() => {
    scheduledNodesRef.current.forEach((n) => { try { n.stop(); } catch {} });
    scheduledNodesRef.current = [];
  }, []);

  const clear = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    endTimeRef.current = null;
    clearTimerState();
  }, []);

  const tick = useCallback(() => {
    if (endTimeRef.current === null) return;
    const r = Math.round((endTimeRef.current - Date.now()) / 1000);
    setRemaining(r <= 0 ? 0 : r);
  }, []);

  const start = useCallback((secs: number) => {
    cancelScheduledAlarm();
    // Pre-schedule alarm on the Web Audio timeline during this user gesture.
    // iOS Safari won't resume a suspended AudioContext from a timer callback,
    // but tones already scheduled on the timeline will fire correctly.
    const ctx = getAudioCtx();
    if (ctx) scheduledNodesRef.current = scheduleAlarm(ctx, secs);
    clear();
    setDone(false);
    setRemaining(secs);
    endTimeRef.current = Date.now() + secs * 1000;
    saveTimerState(endTimeRef.current, secs);
    // Tick every 500ms so the display re-syncs quickly after the tab resumes.
    intervalRef.current = setInterval(tick, 500);
  }, [clear, cancelScheduledAlarm, tick]);

  const stop = useCallback(() => {
    cancelScheduledAlarm();
    clear();
    setRemaining(null);
    setDone(false);
  }, [clear, cancelScheduledAlarm]);

  // Restore timer state after navigation (component remount).
  useEffect(() => {
    const saved = loadTimerState();
    if (!saved) return;
    const r = Math.round((saved.endTime - Date.now()) / 1000);
    endTimeRef.current = saved.endTime;
    setSeconds(saved.secs);
    setRemaining(r > 0 ? r : 0);
    intervalRef.current = setInterval(tick, 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-sync immediately when the tab becomes visible again.
  useEffect(() => {
    const onVisible = () => { if (endTimeRef.current !== null) tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [tick]);

  useEffect(() => {
    if (remaining === 0 && !done) {
      clear();
      setDone(true);
      // Pre-scheduled tones handle iOS. For desktop/non-iOS, fire immediately
      // as a fallback in case scheduling drifted.
      const ctx = getAudioCtx();
      if (ctx && scheduledNodesRef.current.length === 0) playAlarmNow(ctx);
      scheduledNodesRef.current = [];
    }
  }, [remaining, done, clear]);

  // On unmount: stop the interval but keep localStorage so we can restore on remount.
  useEffect(() => () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    cancelScheduledAlarm();
  }, [cancelScheduledAlarm]);

  const progress = remaining !== null && seconds > 0 ? remaining / seconds : 1;
  const circumference = 2 * Math.PI * 26;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed bottom-[4.5rem] left-1/2 z-40 -translate-x-1/2 md:bottom-4">
      <div className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 shadow-xl ring-1 transition-colors ${
        done ? "bg-green-500 ring-green-400 text-white"
          : isRunning ? "bg-gray-900 ring-gray-700 text-white dark:bg-gray-800 dark:ring-gray-600"
          : "bg-white ring-gray-200 text-gray-900 dark:bg-gray-900 dark:ring-gray-700 dark:text-white"
      }`}>
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center">
          <svg className="-rotate-90" width="56" height="56">
            <circle cx="28" cy="28" r="26" fill="none" strokeWidth="3"
              className={done ? "stroke-green-300/40" : "stroke-gray-200 dark:stroke-gray-700"} />
            <circle cx="28" cy="28" r="26" fill="none" strokeWidth="3"
              strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              className={`transition-all duration-1000 ${done ? "stroke-white" : "stroke-blue-500"}`}
            />
          </svg>
          <span className="absolute text-sm font-bold tabular-nums">
            {done ? "GO!" : remaining !== null ? fmt(remaining) : fmt(seconds)}
          </span>
        </div>

        {done || !isRunning ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1">
              {presets.map((s) => (
                <button key={s} onClick={() => { setSeconds(s); start(s); }}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                    done ? "bg-white/20 hover:bg-white/30 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}>
                  {fmt(s)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setSeconds((s) => Math.max(15, s - 15))}
                className="rounded px-1.5 py-0.5 text-xs font-bold opacity-60 hover:opacity-100">−15</button>
              <span className="min-w-[3rem] text-center text-xs opacity-60">{fmt(seconds)}</span>
              <button onClick={() => setSeconds((s) => Math.min(300, s + 15))}
                className="rounded px-1.5 py-0.5 text-xs font-bold opacity-60 hover:opacity-100">+15</button>
              <button onClick={() => start(seconds)}
                className={`ml-1 rounded-lg px-3 py-1 text-xs font-semibold ${
                  done ? "bg-white/20 hover:bg-white/30 text-white" : "bg-gray-700 hover:bg-gray-600 text-white dark:bg-gray-600"
                }`}>
                Start
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs opacity-70">Rest timer</p>
            <button onClick={stop} className="rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ID_INDEX: Record<string, number> = {
  "upper-a": 0, "lower-a": 1, "cardio": 2, "upper-b": 3, "lower-b": 4, "easy-cardio": 5,
};

function computedDayOfWeek(startDate: string | null | undefined, dayId: string): string {
  if (!startDate) return "";
  const [y, m, d] = startDate.split("-").map(Number);
  const startDow = new Date(y, m - 1, d).getDay();
  const idx = DAY_ID_INDEX[dayId] ?? 0;
  return WEEK_DAYS[(startDow + idx) % 7];
}

// ── PlanView ─────────────────────────────────────────────────────────────────
export function PlanView({ status }: { status?: PlanStatus }) {
  const defaultDay = status?.todayDayId ?? status?.nextDayId ?? "upper-a";
  const defaultPhase = status?.currentPhase ?? 1;
  const [phase, setPhase] = useState<Phase>(defaultPhase);
  const [activeDay, setActiveDay] = useState<string>(defaultDay);
  const days = getPlanForPhase(phase);
  const selectedDay = days.find((d) => d.id === activeDay) ?? days[0];
  const colors = PHASE_COLORS[phase];

  // Lifted set-completion state: exerciseKey → number of completed sets
  const [completedSetsMap, setCompletedSetsMap] = useState<Record<string, number>>({});

  // Workout-done flow
  const [marking, setMarking] = useState(false);
  const [markedDone, setMarkedDone] = useState(false);
  const [markNote, setMarkNote] = useState<string | null>(null);

  function handleDayChange(id: string) {
    setActiveDay(id);
    setCompletedSetsMap({});
    setMarkedDone(false);
  }

  function handleSetToggle(exerciseKey: string, index: number) {
    setCompletedSetsMap((prev) => {
      const current = prev[exerciseKey] ?? 0;
      return { ...prev, [exerciseKey]: index < current ? index : index + 1 };
    });
  }

  // All exercises done?
  const trackableExercises = selectedDay.exercises;
  const allExercisesDone =
    trackableExercises.length > 0 &&
    trackableExercises.every((ex) => {
      const total = parseInt(ex.sets, 10) || 3;
      return (completedSetsMap[ex.key] ?? 0) >= total;
    });

  async function handleMarkComplete() {
    setMarking(true);
    try {
      const result = await markPlanDayCompleteAction(activeDay);
      if (!result.marked) {
        setMarkNote("No session found to log — all sessions may already be complete.");
        setTimeout(() => setMarkNote(null), 3000);
        return;
      }
      playSuccess();
      setMarkedDone(true);
      setMarkNote(result.usedFallback ? "Logged against your nearest scheduled session." : null);
      setTimeout(() => {
        setCompletedSetsMap({});
        setMarkedDone(false);
        setMarkNote(null);
      }, 2500);
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-40">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My 12-Week Plan</h1>
        {status?.startDate ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Week {status.currentWeek} of 12 · {status.completedCount} sessions done
          </p>
        ) : (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            6 days/week · Upper/Lower split
          </p>
        )}
      </div>

      {/* Phase selector */}
      <div className="grid grid-cols-3 gap-3">
        {([1, 2, 3] as Phase[]).map((p) => {
          const c = PHASE_COLORS[p];
          const active = phase === p;
          return (
            <button key={p} onClick={() => setPhase(p)}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                active ? `${c.bg} ${c.border} ${c.text}` : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-300"
              }`}>
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
      <div className="flex gap-2 overflow-x-auto pt-3 pb-1">
        {days.map((day) => {
          const isToday = status?.todayDayId === day.id;
          const isMissed = status?.missedDayIds?.includes(day.id);
          const isActive = activeDay === day.id;
          return (
            <button key={day.id} onClick={() => handleDayChange(day.id)}
              className={`relative flex-shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : isMissed
                  ? "bg-red-50 text-red-700 ring-1 ring-red-300 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}>
              {isToday && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-1.5 py-px text-[9px] font-bold text-white leading-tight">
                  TODAY
                </span>
              )}
              {isMissed && !isActive && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-red-500 px-1.5 py-px text-[9px] font-bold text-white leading-tight">
                  MISSED
                </span>
              )}
              {day.label.split(" — ")[0]}
            </button>
          );
        })}
      </div>

      {/* Selected day */}
      <DayView
        day={selectedDay}
        phase={phase}
        completedSetsMap={completedSetsMap}
        onSetToggle={handleSetToggle}
        dayOfWeek={computedDayOfWeek(status?.startDate, selectedDay.id)}
      />

      {/* Workout-complete banner */}
      {(allExercisesDone || markedDone) && (
        <div className={`fixed bottom-[4.5rem] left-0 right-0 z-50 px-4 md:bottom-4 md:left-auto md:right-8 md:w-80`}>
          <div className={`rounded-2xl p-4 shadow-2xl ring-1 transition-all ${
            markedDone
              ? "bg-green-500 ring-green-400 text-white"
              : "bg-gray-900 ring-gray-700 text-white dark:bg-gray-800"
          }`}>
            {markedDone ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="font-bold">Workout logged!</p>
                  <p className="text-sm opacity-80">
                    {markNote ?? "Marked complete on your calendar."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">All sets done!</p>
                  <p className="text-xs opacity-70">Log this on your calendar?</p>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <button
                    onClick={() => setCompletedSetsMap({})}
                    className="rounded-xl bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20 transition-colors"
                  >
                    Not yet
                  </button>
                  <button
                    onClick={handleMarkComplete}
                    disabled={marking}
                    className="rounded-xl bg-green-500 px-4 py-2 text-sm font-bold hover:bg-green-400 disabled:opacity-60 transition-colors"
                  >
                    {marking ? "Saving…" : "Mark done"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error note when mark-done finds no session */}
      {markNote && !markedDone && (
        <div className="fixed bottom-[4.5rem] left-0 right-0 z-50 px-4 md:bottom-4 md:left-auto md:right-8 md:w-80">
          <div className="rounded-2xl bg-gray-800 p-4 shadow-2xl ring-1 ring-gray-700 text-white">
            <p className="text-sm">{markNote}</p>
          </div>
        </div>
      )}

      {/* Floating rest timer — hidden when completion banner is active */}
      {!allExercisesDone && !markedDone && <RestTimer phase={phase} />}
    </div>
  );
}

// ── DayView ───────────────────────────────────────────────────────────────────
function DayView({
  day,
  phase,
  completedSetsMap,
  onSetToggle,
  dayOfWeek,
}: {
  day: WorkoutDay;
  phase: Phase;
  completedSetsMap: Record<string, number>;
  onSetToggle: (exerciseKey: string, index: number) => void;
  dayOfWeek?: string;
}) {
  const colors = PHASE_COLORS[phase];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{day.label}</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DAY_TYPE_COLORS[day.type]}`}>
          {dayOfWeek || day.dayOfWeek}
        </span>
      </div>

      {day.warmUp && day.warmUp.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800/50 dark:bg-orange-950/30">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-orange-700 dark:text-orange-400">
            🔥 Warm-Up (5 min)
          </p>
          <ul className="space-y-1">
            {day.warmUp.map((item, i) => (
              <li key={i} className="text-sm text-orange-800 dark:text-orange-300">• {item}</li>
            ))}
          </ul>
        </div>
      )}

      {day.cardioNote && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800/50 dark:bg-yellow-950/30">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">🏃 {day.cardioNote}</p>
        </div>
      )}

      {day.exercises.length > 0 ? (
        <div className="space-y-4">
          {day.exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.key}
              exercise={ex}
              index={i}
              colors={colors}
              completedSets={completedSetsMap[ex.key] ?? 0}
              onSetToggle={(idx) => onSetToggle(ex.key, idx)}
            />
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

// ── ExerciseCard ──────────────────────────────────────────────────────────────
function ExerciseCard({
  exercise,
  index,
  colors,
  completedSets,
  onSetToggle,
}: {
  exercise: PlannedExercise;
  index: number;
  colors: { bg: string; text: string; border: string; badge: string };
  completedSets: number;
  onSetToggle: (index: number) => void;
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const totalSets = parseInt(exercise.sets, 10) || 3;
  const allDone = completedSets >= totalSets;
  const imgSrc = `/exercise-images/${exercise.key}/${imgIndex}.jpg`;

  return (
    <div className={`overflow-hidden rounded-xl border shadow-sm transition-colors ${
      allDone
        ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
    }`}>
      <div className="flex gap-4 p-4">
        {/* Image */}
        <button
          onClick={() => setImgIndex((i) => (i === 0 ? 1 : 0))}
          className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
          title="Tap to see other position"
        >
          <Image src={imgSrc} alt={exercise.name} fill className="object-cover transition-opacity duration-300" sizes="96px" />
          <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1 text-[9px] text-white">
            {imgIndex === 0 ? "START" : "END"}
          </span>
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className={`text-xs font-bold ${allDone ? "text-green-600 dark:text-green-400" : colors.text}`}>
                #{index + 1}
              </span>
              <h3 className="font-semibold text-gray-900 dark:text-white">{exercise.name}</h3>
            </div>
            {allDone && (
              <span className="flex-shrink-0 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">✓ Done</span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap gap-1">
            {exercise.primaryMuscles.map((m) => (
              <span key={m} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400 capitalize">
                {m}
              </span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <Stat label="Reps" value={exercise.reps} />
            <Stat label="Start" value={exercise.startWeight} small />
          </div>
        </div>
      </div>

      {/* Set tracker */}
      <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            Sets {completedSets}/{totalSets}
          </span>
          <div className="flex gap-2">
            {Array.from({ length: totalSets }).map((_, i) => (
              <button
                key={i}
                onClick={() => onSetToggle(i)}
                className={`h-8 w-8 rounded-full border-2 text-xs font-bold transition-all active:scale-95 ${
                  i < completedSets
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500"
                }`}
              >
                {i < completedSets ? "✓" : i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target + Tip */}
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
    <svg className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
