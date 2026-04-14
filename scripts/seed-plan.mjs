// Imports the 12-week ICS plan into the app's sessions table.
// Run: node scripts/seed-plan.mjs
// Requires: the DB to have at least one user (i.e. you've logged in once).

import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DB_PATH = join(ROOT, "data", "app.db");
const ICS_PATH = join(ROOT, "docs", "12-week-workout-plan.ics");

// ── Parse ICS ───────────────────────────────────────────────────────────────

function parseIcs(content) {
  const events = [];
  const lines = content.replace(/\r\n|\r/g, "\n").split("\n");
  let inEvent = false;
  let cur = {};

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") { inEvent = true; cur = {}; }
    else if (line === "END:VEVENT") {
      if (cur.dtstart && cur.summary) events.push({ ...cur });
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith("DTSTART")) {
        const m = line.match(/:(\d{8}T\d{6})/);
        if (m) cur.dtstart = m[1];
      } else if (line.startsWith("SUMMARY:")) {
        cur.summary = line.slice(8);
      }
    }
  }
  return events;
}

function toDatetime(dt) {
  // "20260414T073000" → "2026-04-14T07:30:00"
  return `${dt.slice(0,4)}-${dt.slice(4,6)}-${dt.slice(6,8)}T${dt.slice(9,11)}:${dt.slice(11,13)}:${dt.slice(13,15)}`;
}

function workoutName(summary) {
  // "[Wk1/Foundation] Upper A - Push Focus" → "Upper A - Push Focus"
  return summary.replace(/^\[.*?\]\s*/, "");
}

function weekNote(summary) {
  // "[Wk1/Foundation] ..." → "Week 1 · Foundation"
  const m = summary.match(/\[Wk(\d+)\/(.*?)\]/);
  return m ? `Week ${m[1]} · ${m[2]}` : null;
}

// ── Seed ────────────────────────────────────────────────────────────────────

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const user = db.prepare("SELECT id FROM users LIMIT 1").get();
if (!user) {
  console.error("No user in DB — open the app and sign in first, then re-run.");
  process.exit(1);
}
const userId = user.id;
console.log(`User: ${userId}`);

const ics = readFileSync(ICS_PATH, "utf-8");
const events = parseIcs(ics);
console.log(`Events in ICS: ${events.length}`);

// Collect unique workout types and upsert workout records
const typeSet = new Set(events.map(e => workoutName(e.summary)));
const workoutMap = {};

for (const name of typeSet) {
  let row = db.prepare("SELECT id FROM workouts WHERE user_id=? AND name=?").get(userId, name);
  if (!row) {
    const id = randomUUID();
    db.prepare("INSERT INTO workouts (id, user_id, name) VALUES (?,?,?)").run(id, userId, name);
    row = { id };
    console.log(`  Created workout: ${name}`);
  }
  workoutMap[name] = row.id;
}

// Insert sessions (idempotent — skip if same user+scheduled_at+workout_id exists)
const today = "2026-04-14"; // April 14 2026
let inserted = 0, skipped = 0;

for (const ev of events) {
  const scheduledAt = toDatetime(ev.dtstart);
  const name = workoutName(ev.summary);
  const note = weekNote(ev.summary);
  const workoutId = workoutMap[name];
  const isToday = scheduledAt.startsWith(today);

  const exists = db
    .prepare("SELECT id FROM sessions WHERE user_id=? AND scheduled_at=? AND workout_id=?")
    .get(userId, scheduledAt, workoutId);

  if (exists) { skipped++; continue; }

  const completedAt = isToday ? new Date().toISOString() : null;
  db.prepare(
    "INSERT INTO sessions (id, user_id, workout_id, scheduled_at, completed_at, notes) VALUES (?,?,?,?,?,?)"
  ).run(randomUUID(), userId, workoutId, scheduledAt, completedAt, note);

  if (isToday) console.log(`  ✓ Inserted + marked complete: ${ev.summary}`);
  inserted++;
}

console.log(`Done — inserted ${inserted}, skipped ${skipped}.`);
db.close();
