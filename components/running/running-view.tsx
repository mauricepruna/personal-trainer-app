"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface RunningPlan {
  id: string;
  name: string;
  goal_distance_km: number;
  weeks: number;
  level: string;
}

interface RunningPlanSession {
  id: string;
  plan_id: string;
  week: number;
  day: number;
  type: string;
  distance_km: number | null;
  notes: string | null;
}

interface RunLog {
  id: string;
  user_id: string;
  date: string;
  distance_km: number;
  duration_sec: number;
  pace_min_km: number | null;
}

interface RunningViewProps {
  plans: RunningPlan[];
  runLogs: RunLog[];
}

export function RunningView({ plans, runLogs: initialLogs }: RunningViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [tab, setTab] = useState<"log" | "plans">("log");
  const [runLogs, setRunLogs] = useState(initialLogs);
  const [selectedPlan, setSelectedPlan] = useState<RunningPlan | null>(null);
  const [planSessions, setPlanSessions] = useState<RunningPlanSession[]>([]);

  // Log form
  const [showForm, setShowForm] = useState(false);
  const [distance, setDistance] = useState("");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("30");
  const [seconds, setSeconds] = useState("0");
  const [saving, setSaving] = useState(false);

  async function handleLogRun() {
    if (!distance) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const duration_sec = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
      const dist = parseFloat(distance);
      const pace_min_km = dist > 0 ? duration_sec / 60 / dist : null;

      const { data, error } = await supabase
        .from("running_log")
        .insert({
          distance_km: dist,
          duration_sec,
          pace_min_km,
        })
        .select()
        .single();
      if (error) throw error;
      setRunLogs((prev) => [data, ...prev]);
      setShowForm(false);
      setDistance("");
      setHours("0");
      setMinutes("30");
      setSeconds("0");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteRun(id: string) {
    const supabase = createClient();
    await supabase.from("running_log").delete().eq("id", id);
    setRunLogs((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
  }

  async function viewPlan(plan: RunningPlan) {
    setSelectedPlan(plan);
    const supabase = createClient();
    const { data } = await supabase
      .from("running_sessions")
      .select("*")
      .eq("plan_id", plan.id)
      .order("week")
      .order("day");
    setPlanSessions(data ?? []);
  }

  function formatDuration(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  }

  function formatPace(pace: number | null) {
    if (!pace) return "—";
    const m = Math.floor(pace);
    const s = Math.round((pace - m) * 60);
    return `${m}:${String(s).padStart(2, "0")} /km`;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t.running.title}
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <button
          onClick={() => { setTab("log"); setSelectedPlan(null); }}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "log"
              ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {t.running.log}
        </button>
        <button
          onClick={() => { setTab("plans"); setSelectedPlan(null); }}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "plans"
              ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {t.running.plans}
        </button>
      </div>

      {/* Log tab */}
      {tab === "log" && (
        <div className="space-y-4">
          <Button size="sm" onClick={() => setShowForm(true)}>
            + {t.running.logRun}
          </Button>

          {showForm && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.running.distance}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.running.duration}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">{t.running.hours}</label>
                      <input
                        type="number"
                        min={0}
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t.running.minutes}</label>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value)}
                        className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t.running.seconds}</label>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={seconds}
                        onChange={(e) => setSeconds(e.target.value)}
                        className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleLogRun} loading={saving} disabled={!distance}>
                    {t.common.save}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowForm(false)}>
                    {t.common.cancel}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {runLogs.length === 0 ? (
            <p className="py-4 text-center text-gray-500 dark:text-gray-400">
              {t.running.noRuns}
            </p>
          ) : (
            <div className="space-y-2">
              {runLogs.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {run.distance_km} km
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDuration(run.duration_sec)} &middot; {formatPace(run.pace_min_km)} &middot; {run.date}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteRun(run.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plans tab */}
      {tab === "plans" && !selectedPlan && (
        <div className="space-y-3">
          {plans.length === 0 ? (
            <p className="py-4 text-center text-gray-500 dark:text-gray-400">
              {t.running.noPlans}
            </p>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{plan.name}</h3>
                    <p className="text-sm text-gray-500">
                      {plan.goal_distance_km} km &middot; {plan.weeks} {t.running.weeks} &middot; {plan.level}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => viewPlan(plan)}>
                    {t.running.viewPlan}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Plan detail */}
      {tab === "plans" && selectedPlan && (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedPlan(null)}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            &larr; {t.common.back}
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedPlan.name}
          </h2>
          <p className="text-sm text-gray-500">
            {selectedPlan.goal_distance_km} km &middot; {selectedPlan.weeks} {t.running.weeks} &middot; {selectedPlan.level}
          </p>
          {planSessions.length === 0 ? (
            <p className="text-sm text-gray-500">No sessions in this plan</p>
          ) : (
            <div className="space-y-2">
              {Array.from(new Set(planSessions.map((s) => s.week))).map((week) => (
                <div key={week} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                  <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.common.week} {week}
                  </h3>
                  <div className="space-y-1">
                    {planSessions
                      .filter((s) => s.week === week)
                      .map((s) => (
                        <div key={s.id} className="text-sm text-gray-600 dark:text-gray-400">
                          Day {s.day}: {s.type}
                          {s.distance_km ? ` — ${s.distance_km} km` : ""}
                          {s.notes ? ` (${s.notes})` : ""}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
