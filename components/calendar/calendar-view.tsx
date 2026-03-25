"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface SessionWithWorkout {
  id: string;
  user_id: string;
  workout_id: string;
  scheduled_at: string;
  completed_at: string | null;
  notes: string | null;
  workout: { name: string } | null;
}

interface CalendarViewProps {
  initialSessions: SessionWithWorkout[];
  workouts: { id: string; name: string }[];
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ initialSessions, workouts }: CalendarViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [sessions, setSessions] = useState(initialSessions);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [formWorkoutId, setFormWorkoutId] = useState("");
  const [formTime, setFormTime] = useState("09:00");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const days = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const sessionsByDate = useMemo(() => {
    const map: Record<string, SessionWithWorkout[]> = {};
    for (const s of sessions) {
      const date = s.scheduled_at.split("T")[0];
      (map[date] ??= []).push(s);
    }
    return map;
  }, [sessions]);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function handleDayClick(day: number) {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(date);
    setShowForm(true);
  }

  async function handleSchedule() {
    if (!formWorkoutId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const scheduledAt = `${selectedDate}T${formTime}:00`;
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          workout_id: formWorkoutId,
          scheduled_at: scheduledAt,
          notes: formNotes || null,
        })
        .select("*, workout:workouts(name)")
        .single();
      if (error) throw error;
      setSessions((prev) => [...prev, data]);
      setShowForm(false);
      setFormWorkoutId("");
      setFormNotes("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(session: SessionWithWorkout) {
    const supabase = createClient();
    const completed_at = session.completed_at ? null : new Date().toISOString();
    await supabase
      .from("sessions")
      .update({ completed_at })
      .eq("id", session.id);
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, completed_at } : s))
    );
    router.refresh();
  }

  async function deleteSession(id: string) {
    if (!confirm(t.calendar.deleteConfirm)) return;
    const supabase = createClient();
    await supabase.from("sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  }

  const selectedSessions = sessionsByDate[selectedDate] ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t.calendar.title}
      </h1>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="rounded p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          {MONTHS[currentMonth]} {currentYear}
        </span>
        <button onClick={nextMonth} className="rounded p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="bg-white p-2 dark:bg-gray-900" />;
          }
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const daySessions = sessionsByDate[dateStr] ?? [];
          const isToday = dateStr === formatDate(today);
          const isSelected = dateStr === selectedDate;
          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`min-h-[3.5rem] bg-white p-1 text-left transition-colors hover:bg-blue-50 dark:bg-gray-900 dark:hover:bg-gray-800 ${
                isSelected ? "ring-2 ring-inset ring-blue-500" : ""
              }`}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                isToday ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}>
                {day}
              </span>
              {daySessions.length > 0 && (
                <div className="mt-0.5 space-y-0.5">
                  {daySessions.slice(0, 2).map((s) => (
                    <div
                      key={s.id}
                      className={`truncate rounded px-1 text-[10px] leading-tight ${
                        s.completed_at
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {s.workout?.name ?? "Workout"}
                    </div>
                  ))}
                  {daySessions.length > 2 && (
                    <span className="text-[10px] text-gray-400">
                      +{daySessions.length - 2}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date details */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white">{selectedDate}</h3>
          <Button size="sm" onClick={() => setShowForm(true)}>
            + {t.calendar.schedule}
          </Button>
        </div>

        {showForm && (
          <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <select
              value={formWorkoutId}
              onChange={(e) => setFormWorkoutId(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">{t.calendar.selectWorkout}</option>
              {workouts.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <input
              type="time"
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <textarea
              placeholder={t.calendar.notes}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSchedule} loading={saving} disabled={!formWorkoutId}>
                {t.common.save}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowForm(false)}>
                {t.common.cancel}
              </Button>
            </div>
          </div>
        )}

        {selectedSessions.length === 0 && !showForm ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.calendar.noSessions}</p>
        ) : (
          <div className="space-y-2">
            {selectedSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-2 dark:border-gray-800"
              >
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {s.workout?.name ?? "Workout"}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    {new Date(s.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {s.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleComplete(s)}
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      s.completed_at
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {s.completed_at ? t.calendar.completed : t.calendar.markComplete}
                  </button>
                  <button
                    onClick={() => deleteSession(s.id)}
                    className="rounded p-1 text-gray-400 hover:text-red-600"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
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
