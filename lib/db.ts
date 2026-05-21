import Database from "better-sqlite3";
import path from "path";

declare global {
  var _popuDb: Database.Database | undefined;
}

function getDb(): Database.Database {
  if (!global._popuDb) {
    const dbPath = process.env.DATA_DIR
      ? path.join(process.env.DATA_DIR, "popu-palma.db")
      : path.join(process.cwd(), "popu-palma.db");
    global._popuDb = new Database(dbPath);
    global._popuDb.pragma("journal_mode = WAL");
    global._popuDb.pragma("foreign_keys = ON");
    initSchema(global._popuDb);
  }
  return global._popuDb;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
      photo_url TEXT,
      elo INTEGER NOT NULL DEFAULT 1000,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`);

  // Migrate: add photo_data column if it doesn't exist
  try { db.exec("ALTER TABLE users ADD COLUMN photo_data BLOB"); } catch { /* already exists */ }

  db.exec(`

    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      voter_id TEXT NOT NULL REFERENCES users(id),
      winner_id TEXT NOT NULL REFERENCES users(id),
      loser_id TEXT NOT NULL REFERENCES users(id),
      winner_elo_change INTEGER NOT NULL,
      loser_elo_change INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);
    CREATE INDEX IF NOT EXISTS idx_votes_winner ON votes(winner_id);
    CREATE INDEX IF NOT EXISTS idx_votes_loser ON votes(loser_id);
    CREATE INDEX IF NOT EXISTS idx_votes_created ON votes(created_at);
    CREATE INDEX IF NOT EXISTS idx_users_gender_elo ON users(gender, elo);
  `);
}

export default getDb;
