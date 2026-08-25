import initSqlJs from 'sql.js';

let db: any = null;

export async function initDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  db = new SQL.Database();
  
  db.run(`
    CREATE TABLE prompts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE prompt_versions (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      system_prompt TEXT NOT NULL,
      model TEXT NOT NULL,
      temperature REAL NOT NULL,
      commit_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(prompt_id) REFERENCES prompts(id)
    );

    CREATE TABLE experiments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      prompt_id TEXT NOT NULL,
      variant_a_version_id TEXT NOT NULL,
      variant_b_version_id TEXT NOT NULL,
      traffic_split_a REAL NOT NULL, -- percentage 0-100
      status TEXT NOT NULL, -- 'running', 'completed', 'cancelled'
      primary_metric TEXT NOT NULL,
      winner_version_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(prompt_id) REFERENCES prompts(id),
      FOREIGN KEY(variant_a_version_id) REFERENCES prompt_versions(id),
      FOREIGN KEY(variant_b_version_id) REFERENCES prompt_versions(id)
    );

    CREATE TABLE experiment_logs (
      id TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      assigned_variant_id TEXT NOT NULL,
      latency_ms INTEGER,
      quality_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(experiment_id) REFERENCES experiments(id),
      FOREIGN KEY(assigned_variant_id) REFERENCES prompt_versions(id)
    );
  `);
  
  return db;
}

export function getDb() {
  if (!db) throw new Error("DB not initialized");
  return db;
}
