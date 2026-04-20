"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPlanStartDateAction, reschedulePlanAction } from "@/lib/actions/plan";

type Mode = "idle" | "set" | "reschedule";

export function PlanStartBanner({ startDate }: { startDate: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(startDate ? "idle" : "set");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const formatted = startDate
    ? new Date(startDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      })
    : null;

  function submit(action: (fd: FormData) => Promise<{ error?: string; success?: boolean }>) {
    return (formData: FormData) => {
      setError(null);
      startTransition(async () => {
        const res = await action(formData);
        if (res?.error) setError(res.error);
        else { setMode("idle"); router.refresh(); }
      });
    };
  }

  // ── Idle banner ──────────────────────────────────────────────────────────
  if (mode === "idle" && formatted) {
    return (
      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-3 space-y-2">
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              Plan starts {formatted}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Sessions scheduled on your calendar
            </p>
          </div>
        </div>
        <div className="flex gap-2 pl-8">
          <button
            onClick={() => setMode("reschedule")}
            className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            Missed a session? Reschedule →
          </button>
          <span className="text-emerald-300 dark:text-emerald-700 select-none">|</span>
          <button
            onClick={() => setMode("set")}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Reset plan
          </button>
        </div>
      </div>
    );
  }

  // ── Set / Reset start date ────────────────────────────────────────────────
  if (mode === "set") {
    return (
      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-4 py-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
            {startDate ? "Reset plan start date" : "Set your plan start date"}
          </p>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
          Pick the date of your first workout (Upper A). All 72 sessions will be regenerated on your calendar.{" "}
          {startDate && <strong>This will clear completed session history.</strong>}
        </p>
        <form action={submit(setPlanStartDateAction)} className="flex items-center gap-2">
          <input
            type="date"
            name="start_date"
            required
            defaultValue={startDate ?? new Date().toISOString().split("T")[0]}
            className="flex-1 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          {startDate && (
            <button type="button" onClick={() => setMode("idle")}
              className="rounded-lg border border-blue-300 dark:border-blue-700 px-3 py-2 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
              Cancel
            </button>
          )}
        </form>
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  // ── Reschedule ────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-4">
      <div className="flex items-center gap-2 mb-2">
        <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/><path d="M12 8v4l3 3"/>
        </svg>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          Reschedule remaining sessions
        </p>
      </div>
      <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
        Pick the date for your <strong>next workout</strong>. Completed sessions stay as-is; the rest of the plan shifts forward from here, keeping the same workout order.
      </p>
      <form action={submit(reschedulePlanAction)} className="flex items-center gap-2">
        <input
          type="date"
          name="from_date"
          required
          defaultValue={new Date().toISOString().split("T")[0]}
          className="flex-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          {isPending ? "Rescheduling…" : "Reschedule"}
        </button>
        <button type="button" onClick={() => setMode("idle")}
          className="rounded-lg border border-amber-300 dark:border-amber-700 px-3 py-2 text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
          Cancel
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
