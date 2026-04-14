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

interface ProgressChartsProps {
  weightLogs: { date: string; weight_kg: number }[];
  weeklyWorkouts: { week: string; count: number }[];
  weeklyRunning: { week: string; km: number }[];
  runStats: { total_runs: number; total_km: number; avg_pace: number } | null;
  completedWorkouts: number;
}

function getWeekLabel(isoWeek: string) {
  // isoWeek format: "YYYY-WW" from SQLite strftime('%Y-%W', ...)
  const [year, week] = isoWeek.split("-").map(Number);
  const jan1 = new Date(year, 0, 1);
  const daysOffset = (week - 1) * 7;
  const d = new Date(jan1.getTime() + daysOffset * 86400000);
  return d.toLocaleString("default", { month: "short", day: "numeric" });
}

function formatPace(minKm: number) {
  const m = Math.floor(minKm);
  const s = Math.round((minKm - m) * 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("default", { month: "short", day: "numeric" });
}

export function ProgressCharts({
  weightLogs,
  weeklyWorkouts,
  weeklyRunning,
  runStats,
  completedWorkouts,
}: ProgressChartsProps) {
  const { t } = useTranslation();

  const weightData = weightLogs
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((w) => ({ date: formatDate(w.date), weight: w.weight_kg }));

  const workoutData = weeklyWorkouts.map((w) => ({
    label: getWeekLabel(w.week),
    value: w.count,
  }));

  const runData = weeklyRunning.map((w) => ({
    label: getWeekLabel(w.week),
    value: w.km,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t.progress.title}
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t.progress.completedWorkouts} value={String(completedWorkouts)} sub={t.progress.thisMonth} />
        <StatCard label={t.progress.totalRuns} value={String(runStats?.total_runs ?? 0)} />
        <StatCard label={t.progress.totalKm} value={String(runStats?.total_km ?? 0)} />
        <StatCard label={t.progress.avgPace} value={runStats?.avg_pace ? formatPace(runStats.avg_pace) : "—"} />
      </div>

      <ChartCard title={t.progress.weightTrend} subtitle={t.progress.last90Days}>
        {weightData.length < 2 ? (
          <EmptyState message={t.progress.noWeightData} />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => [`${v} kg`, ""]} />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={weightData.length < 20} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t.progress.weeklyWorkouts} subtitle={t.progress.last12Weeks}>
        {workoutData.length === 0 ? (
          <EmptyState message={t.progress.noWorkoutData} />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={workoutData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => [v, ""]} />
              <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={t.progress.weeklyKm} subtitle={t.progress.last12Weeks}>
        {runData.length === 0 ? (
          <EmptyState message={t.progress.noRunData} />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={runData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => [typeof v === "number" ? `${v.toFixed(1)} km` : v, ""]} />
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

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
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
  return <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{message}</p>;
}
