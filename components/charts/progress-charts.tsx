"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "@/lib/i18n/context";

interface WeightEntry {
  date: string;
  weight_kg: number;
}

interface RunEntry {
  date: string;
  distance_km: number;
  duration_sec: number;
  pace_min_km: number | null;
}

interface CompletedSession {
  completed_at: string;
}

interface ProgressChartsProps {
  weightLogs: WeightEntry[];
  runLogs: RunEntry[];
  completedSessions: CompletedSession[];
}

function getWeekLabel(dateStr: string) {
  const d = new Date(dateStr);
  const month = d.toLocaleString("default", { month: "short" });
  return `${month} ${d.getDate()}`;
}

function isoWeekStart(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
  return monday.toISOString().split("T")[0];
}

function aggregateByWeek<T>(
  items: T[],
  getDate: (item: T) => string,
  getValue: (item: T) => number,
  agg: "sum" | "count" = "sum",
  weeks = 12
): { week: string; label: string; value: number }[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);

  const map = new Map<string, number>();
  for (const item of items) {
    const d = getDate(item);
    if (new Date(d) < cutoff) continue;
    const week = isoWeekStart(d);
    const prev = map.get(week) ?? 0;
    map.set(week, agg === "count" ? prev + 1 : prev + getValue(item));
  }

  // Fill in all weeks in range
  const result: { week: string; label: string; value: number }[] = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(now.getUTCDate() - i * 7);
    const week = isoWeekStart(d.toISOString().split("T")[0]);
    if (!result.find((r) => r.week === week)) {
      result.push({ week, label: getWeekLabel(week), value: map.get(week) ?? 0 });
    }
  }
  return result;
}

function formatPace(minKm: number) {
  const m = Math.floor(minKm);
  const s = Math.round((minKm - m) * 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

export function ProgressCharts({
  weightLogs,
  runLogs,
  completedSessions,
}: ProgressChartsProps) {
  const { t } = useTranslation();

  // Weight: show last 90 days, sorted by date
  const weightData = weightLogs
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((w) => ({ date: getWeekLabel(w.date), weight: w.weight_kg }));

  // Weekly workouts
  const workoutWeeks = aggregateByWeek(
    completedSessions,
    (s) => s.completed_at.split("T")[0],
    () => 1,
    "count"
  );

  // Weekly running km
  const runWeeks = aggregateByWeek(
    runLogs,
    (r) => r.date,
    (r) => r.distance_km,
    "sum"
  );

  // Running summary stats
  const totalRuns = runLogs.length;
  const totalKm = runLogs.reduce((sum, r) => sum + r.distance_km, 0);
  const avgPaceRaw =
    runLogs.length > 0
      ? runLogs
          .filter((r) => r.pace_min_km)
          .reduce((sum, r) => sum + (r.pace_min_km ?? 0), 0) /
        runLogs.filter((r) => r.pace_min_km).length
      : null;

  // Completed workouts this month
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const completedThisMonth = completedSessions.filter(
    (s) => s.completed_at >= firstOfMonth
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t.progress.title}
      </h1>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t.progress.completedWorkouts} value={String(completedThisMonth)} sub={t.progress.thisMonth} />
        <StatCard label={t.progress.totalRuns} value={String(totalRuns)} />
        <StatCard label={t.progress.totalKm} value={totalKm.toFixed(1)} />
        <StatCard label={t.progress.avgPace} value={avgPaceRaw ? formatPace(avgPaceRaw) : "—"} />
      </div>

      {/* Body weight */}
      <ChartCard title={t.progress.weightTrend} subtitle={t.progress.last90Days}>
        {weightData.length < 2 ? (
          <EmptyState message={t.progress.noWeightData} />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(v) => [`${v} kg`, ""]}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={weightData.length < 20}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Weekly workouts */}
      <ChartCard title={t.progress.weeklyWorkouts} subtitle={t.progress.last12Weeks}>
        {completedSessions.length === 0 ? (
          <EmptyState message={t.progress.noWorkoutData} />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={workoutWeeks} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => [v, ""]} />
              <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Weekly running */}
      <ChartCard title={t.progress.weeklyKm} subtitle={t.progress.last12Weeks}>
        {runLogs.length === 0 ? (
          <EmptyState message={t.progress.noRunData} />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={runWeeks} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(v) => [typeof v === "number" ? `${v.toFixed(1)} km` : v, ""]}
              />
              <Bar dataKey="value" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{message}</p>
  );
}
