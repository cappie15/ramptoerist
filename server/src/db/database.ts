import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_DIR = path.join(__dirname, '../../data')
const DB_PATH = path.join(DB_DIR, 'ramptoerist.db')

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

export const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS raw_source_messages (
    id TEXT PRIMARY KEY,
    source_name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    external_id TEXT NOT NULL,
    raw_title TEXT NOT NULL,
    raw_message TEXT NOT NULL,
    received_at TEXT NOT NULL,
    location_text TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    location_text TEXT NOT NULL,
    city TEXT NOT NULL,
    street TEXT NOT NULL DEFAULT '',
    lat REAL,
    lng REAL,
    source_count INTEGER NOT NULL DEFAULT 1,
    reportage_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS incident_sources (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL REFERENCES incidents(id),
    source_name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    raw_message TEXT NOT NULL,
    received_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reportages (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL REFERENCES incidents(id),
    source_name TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    published_at TEXT,
    matched_confidence REAL NOT NULL DEFAULT 0.0
  );

  CREATE INDEX IF NOT EXISTS idx_incidents_first_seen ON incidents(first_seen_at DESC);
  CREATE INDEX IF NOT EXISTS idx_incidents_city ON incidents(city);
  CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
  CREATE INDEX IF NOT EXISTS idx_incident_sources_incident_id ON incident_sources(incident_id);
`)

console.log(`[DB] Database ready at ${DB_PATH}`)
