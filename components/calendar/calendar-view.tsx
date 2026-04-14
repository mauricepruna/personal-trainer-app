"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/context";
import {
  createSessionAction,
  toggleSessionCompleteAction,
  updateSessionTimeAction,
  deleteSessionAction,
  updateSessionNotesAction,
} from "@/lib/actions/calendar";
import type { CalendarSession } from "@/lib/db/queries/calendar";
import { Button } from "@/components/ui/button";

interface CalendarViewProps {
  initialSessions: CalendarSession[];
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

function timeFromScheduledAt(scheduledAt: string) {
  // "2026-04-14T07:30:00" → "07:30"
  return scheduledAt.split("T")[1]?.slice(0, 5) ?? "00:00";
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ initialSessions, workouts }: CalendarViewProps) {
  const { t } = useTranslation();
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

  // Notes editing
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState("");

  // Time editing
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingTimeText, setEditingTimeText] = useState("");

  const days = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const sessionsByDate = useMemo(() => {
    const map: Record<string, CalendarSession[]> = {};
    for (const s of sessions) {
      const date = s.scheduled_at.split("T")[0];
      (map[date] ??= []).push(s);
    }
    return map;
  }, [sessions]);

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  }

  function handleDayClick(day: number) {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(date);
    setShowForm(false);
  }

  async function handleSchedule() {
    if (!formWorkoutId) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("workout_id", formWorkoutId);
      formData.set("scheduled_at", `${selectedDate}T${formTime}:00`);
      if (formNotes) formData.set("notes", formNotes);
      await createSessionAction(formData);
      setShowForm(false);
      setFormWorkoutId("");
      setFormNotes("");
      const newSession: CalendarSession = {
        id: crypto.randomUUID(),
        user_id: "",
        workout_id: formWorkoutId,
        workout_name: workouts.find((w) => w.id === formWorkoutId)?.name ?? null,
        scheduled_at: `${selectedDate}T${formTime}:00`,
        completed_at: null,
        notes: formNotes || null,
      };
      setSessions((prev) => [...prev, newSession]);
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(s: CalendarSession) {
    const wasComplete = !!s.completed_at;
    await toggleSessionCompleteAction(s.id, wasComplete);
    setSessions((prev) =>
      prev.map((x) =>
        x.id === s.id
          ? { ...x, completed_at: wasComplete ? null : new Date().toISOString() }
          : x
      )
    );
  }

  function startEditingTime(s: CalendarSession) {
    setEditingTimeId(s.id);
    setEditingTimeText(timeFromScheduledAt(s.scheduled_at));
    // close notes editor if open
    setEditingNotesId(null);
  }

  async function handleSaveTime(id: string) {
    await updateSessionTimeAction(id, editingTimeText);
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const date = s.scheduled_at.split("T")[0];
        return { ...s, scheduled_at: `${date}T${editingTimeText}:00` };
      })
    );
    setEditingTimeId(null);
  }

  function startEditingNotes(s: CalendarSession) {
    setEditingNotesId(s.id);
    setEditingNotesText(s.notes ?? "");
    // close time editor if open
    setEditingTimeId(null);
  }

  async function handleSaveNotes(id: string) {
    await updateSessionNotesAction(id, editingNotesText);
    setSessions((prev) =>
      prev.map((s) => s.id === id ? { ...s, notes: editingNotesText.trim() || null } : s)
    );
    setEditingNotesId(null);
  }

  async function handleDeleteSession(id: string) {
    if (!confirm(t.calendar.deleteConfirm)) return;
    await deleteSessionAction(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  const selectedSessions = sessionsByDate[selectedDate] ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t.calendar.title}
      </h1>

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

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="bg-white p-2 dark:bg-gray-900" />;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const daySessions = sessionsByDate[dateStr] ?? [];
          const isToday = dateStr === formatDate(today);
          const isSelected = dateStr === selectedDate;
          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`min-h-[3.5rem] bg-white p-1 text-left transition-colors hover:bg-blue-50 dark:bg-gray-900 dark:hover:bg-gray-800 ${isSelected ? "ring-2 ring-inset ring-blue-500" : ""}`}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-300"}`}>
                {day}
              </span>
              {daySessions.length > 0 && (
                <div className="mt-0.5 space-y-0.5">
                  {daySessions.slice(0, 2).map((s) => (
                    <div key={s.id} className={`truncate rounded px-1 text-[10px] leading-tight ${s.completed_at ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                      {s.workout_name ?? "Workout"}
                    </div>
                  ))}
                  {daySessions.length > 2 && <span className="text-[10px] text-gray-400">+{daySessions.length - 2}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white">{selectedDate}</h3>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>+ {t.calendar.schedule}</Button>
        </div>

        {showForm && (
          <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <select
              value={formWorkoutId}
              onChange={(e) => setFormWorkoutId(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">{t.calendar.selectWorkout}</option>
              {workouts.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
            <textarea placeholder={t.calendar.notes} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSchedule} loading={saving} disabled={!formWorkoutId}>{t.common.save}</Button>
              <Button size="sm" variant="secondary" onClick={() => setShowForm(false)}>{t.common.cancel}</Button>
            </div>
          </div>
        )}

        {selectedSessions.length === 0 && !showForm ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.calendar.noSessions}</p>
        ) : (
          <div className="space-y-2">
            {selectedSessions.map((s) => (
              <div key={s.id} className="rounded-lg border border-gray-100 p-2 dark:border-gray-800">

                {/* Row: name + time + action buttons */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white truncate">{s.workout_name ?? "Workout"}</span>

                    {/* Time — tap to edit */}
                    {editingTimeId === s.id ? (
                      <input
                        type="time"
                        value={editingTimeText}
                        onChange={(e) => setEditingTimeText(e.target.value)}
                        autoFocus
                        className="rounded border border-blue-400 bg-white px-1.5 py-0.5 text-sm tabular-nums dark:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    ) : (
                      <button
                        onClick={() => startEditingTime(s)}
                        title="Edit time"
                        className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      >
                        <ClockIcon className="h-3.5 w-3.5" />
                        {timeFromScheduledAt(s.scheduled_at)}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-1">
                    {/* Complete toggle */}
                    <button
                      onClick={() => toggleComplete(s)}
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                        s.completed_at
                          ? "bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                      title={s.completed_at ? "Mark as incomplete" : t.calendar.markComplete}
                    >
                      {s.completed_at ? t.calendar.completed : t.calendar.markComplete}
                    </button>

                    {/* Notes */}
                    <button
                      onClick={() => startEditingNotes(s)}
                      title={s.notes ? t.calendar.editNote : t.calendar.addNote}
                      className={`rounded p-1 ${s.notes ? "text-blue-500 hover:text-blue-700 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button onClick={() => handleDeleteSession(s.id)} className="rounded p-1 text-gray-400 hover:text-red-600">
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Time save/cancel */}
                {editingTimeId === s.id && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => handleSaveTime(s.id)}>{t.common.save}</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingTimeId(null)}>{t.common.cancel}</Button>
                  </div>
                )}

                {/* Notes edit / display */}
                {editingNotesId === s.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editingNotesText}
                      onChange={(e) => setEditingNotesText(e.target.value)}
                      rows={3}
                      placeholder={t.calendar.notes}
                      autoFocus
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveNotes(s.id)}>{t.calendar.saveNote}</Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingNotesId(null)}>{t.common.cancel}</Button>
                    </div>
                  </div>
                ) : s.notes ? (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{s.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
}
function ChevronRightIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
}
function XIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
function PencilIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>;
}
function ClockIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
