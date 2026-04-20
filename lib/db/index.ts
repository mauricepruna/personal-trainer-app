import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "app.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','trainer')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS equipment_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS user_equipment (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      equipment_id TEXT NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, equipment_id)
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      muscle_groups TEXT NOT NULL DEFAULT '[]',
      equipment_id TEXT REFERENCES equipment_types(id),
      instructions TEXT,
      video_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      sets INTEGER NOT NULL DEFAULT 3,
      reps INTEGER NOT NULL DEFAULT 10,
      weight_kg REAL,
      rest_sec INTEGER,
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      workout_id TEXT REFERENCES workouts(id) ON DELETE SET NULL,
      scheduled_at TEXT NOT NULL,
      completed_at TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS weight_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      weight_kg REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercise_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      exercise_id TEXT REFERENCES exercises(id) ON DELETE SET NULL,
      sets INTEGER,
      reps INTEGER,
      weight_kg REAL
    );

    CREATE TABLE IF NOT EXISTS running_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      goal_distance_km REAL,
      weeks INTEGER,
      level TEXT
    );

    CREATE TABLE IF NOT EXISTS running_sessions (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL REFERENCES running_plans(id) ON DELETE CASCADE,
      week INTEGER NOT NULL,
      day INTEGER NOT NULL,
      type TEXT,
      distance_km REAL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS running_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      distance_km REAL NOT NULL,
      duration_sec INTEGER,
      pace_min_km REAL
    );

    CREATE TABLE IF NOT EXISTS trainer_clients (
      trainer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (trainer_id, client_id)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      plan_start_date TEXT
    );
  `);
}
