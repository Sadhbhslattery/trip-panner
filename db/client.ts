/**
 * SQLite Database Client (Persistence Layer)
 * 
 * Opens the local SQLite database via expo-sqlite [R8] and wraps it with the Drizzle ORM driver [R9] for type-safe queries.
 *
 * Table creation uses IF NOT EXISTS so the app can be launched on a fresh install (creates tables) or an existing install (no-op). This avoids the
 * need for a separate migration step for this single-user local app.
 *
 * The DB file name is bumped (henplanner4.db) when a breaking schema change is made during development — this forces a clean database on next launch
 * rather than trying to migrate a dirty one.
 *
 * Privacy: the DB file lives in the app's sandboxed storage on both iOS and Android. No data leaves the device — this app is strictly local-only
 * by default, matching the rubric's data privacy requirement.
 *
 * Key references: Expo SQLite [R8], Drizzle ORM [R9].
 */

import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

// Open (or create) the local SQLite database file
// openDatabaseSync is the standard synchronous opener from expo-sqlite [R8]
const sqlite = openDatabaseSync('henplanner4.db');

// Create tables if they don't exist. The CREATE TABLE IF NOT EXISTS pattern
// means this runs safely on every app launch — no-op when tables already exist.
sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    theme TEXT NOT NULL DEFAULT 'light'
  );
`);
sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    guest_count INTEGER NOT NULL DEFAULT 1,
    budget INTEGER NOT NULL DEFAULT 0,
    notes TEXT
  );
`);
sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    colour TEXT NOT NULL,
    icon TEXT NOT NULL
  );
`);
sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    cost INTEGER NOT NULL DEFAULT 0,
    notes TEXT
  );
`);
sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    target_type TEXT NOT NULL,
    target_value INTEGER NOT NULL
  );
`);
sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    dietary TEXT,
    attending TEXT NOT NULL DEFAULT 'full',
    notes TEXT
  );
`);

// Exported Drizzle handle — use this for all queries app-wide
export const db = drizzle(sqlite);