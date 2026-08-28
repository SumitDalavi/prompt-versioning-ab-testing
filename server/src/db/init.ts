import { Pool } from 'pg';

let db: Pool | null = null;

export async function initDb() {
  if (db) return db;
  
  db = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'prompts',
    port: parseInt(process.env.DB_PORT || '5432'),
  });
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prompt_versions (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL REFERENCES prompts(id),
      version INTEGER NOT NULL,
      system_prompt TEXT NOT NULL,
      model TEXT NOT NULL,
      temperature REAL NOT NULL,
      commit_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      prompt_id TEXT NOT NULL REFERENCES prompts(id),
      variant_a_version_id TEXT NOT NULL REFERENCES prompt_versions(id),
      variant_b_version_id TEXT NOT NULL REFERENCES prompt_versions(id),
      traffic_split_a REAL NOT NULL,
      status TEXT NOT NULL,
      primary_metric TEXT NOT NULL,
      winner_version_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS experiment_logs (
      id TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL REFERENCES experiments(id),
      session_id TEXT NOT NULL,
      assigned_variant_id TEXT NOT NULL REFERENCES prompt_versions(id),
      latency_ms INTEGER,
      quality_score REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  return db;
}

export function getDb(): Pool {
  if (!db) throw new Error("DB not initialized");
  return db;
}
