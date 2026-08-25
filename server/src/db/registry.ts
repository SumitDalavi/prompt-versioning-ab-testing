import { getDb } from './init';
import { v4 as uuidv4 } from 'uuid';

export function createPrompt(name: string) {
  const db = getDb();
  const id = uuidv4();
  db.run(`INSERT INTO prompts (id, name) VALUES (?, ?)`, [id, name]);
  return id;
}

export function createPromptVersion(promptId: string, systemPrompt: string, model: string, temperature: number, commitMessage: string) {
  const db = getDb();
  const id = uuidv4();
  
  const res = db.exec(`SELECT MAX(version) as max_version FROM prompt_versions WHERE prompt_id = '${promptId}'`);
  let maxVersion = 0;
  if (res.length > 0 && res[0].values[0][0] !== null) {
    maxVersion = res[0].values[0][0] as number;
  }
  const version = maxVersion + 1;

  db.run(
    `INSERT INTO prompt_versions (id, prompt_id, version, system_prompt, model, temperature, commit_message) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, promptId, version, systemPrompt, model, temperature, commitMessage]
  );
  return id;
}

export function createExperiment(name: string, promptId: string, variantA: string, variantB: string, trafficSplitA: number) {
  const db = getDb();
  const id = uuidv4();
  db.run(
    `INSERT INTO experiments (id, name, prompt_id, variant_a_version_id, variant_b_version_id, traffic_split_a, status, primary_metric) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, promptId, variantA, variantB, trafficSplitA, 'running', 'quality_score']
  );
  return id;
}

export function logExperimentInteraction(experimentId: string, sessionId: string, assignedVariantId: string, latencyMs: number) {
  const db = getDb();
  const id = uuidv4();
  db.run(
    `INSERT INTO experiment_logs (id, experiment_id, session_id, assigned_variant_id, latency_ms) VALUES (?, ?, ?, ?, ?)`,
    [id, experimentId, sessionId, assignedVariantId, latencyMs]
  );
  return id;
}

export function updateExperimentLogQuality(logId: string, qualityScore: number) {
  const db = getDb();
  db.run(`UPDATE experiment_logs SET quality_score = ? WHERE id = ?`, [qualityScore, logId]);
}

export function getActiveExperiment(promptId: string) {
  const db = getDb();
  const res = db.exec(`SELECT * FROM experiments WHERE prompt_id = '${promptId}' AND status = 'running' LIMIT 1`);
  if (res.length === 0) return null;
  const cols = res[0].columns;
  const vals = res[0].values[0];
  const exp: any = {};
  cols.forEach((c: string, i: number) => exp[c] = vals[i]);
  return exp;
}

export function getPromptVersion(versionId: string) {
  const db = getDb();
  const res = db.exec(`SELECT * FROM prompt_versions WHERE id = '${versionId}'`);
  if (res.length === 0) return null;
  const cols = res[0].columns;
  const vals = res[0].values[0];
  const pv: any = {};
  cols.forEach((c: string, i: number) => pv[c] = vals[i]);
  return pv;
}

export function getAllExperiments() {
  const db = getDb();
  const res = db.exec(`SELECT * FROM experiments ORDER BY created_at DESC`);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((vals: any[]) => {
    const exp: any = {};
    cols.forEach((c: string, i: number) => exp[c] = vals[i]);
    return exp;
  });
}

export function getExperimentStats(experimentId: string) {
  const db = getDb();
  const res = db.exec(`
    SELECT assigned_variant_id, COUNT(*) as sample_size, AVG(quality_score) as mean_quality, AVG(latency_ms) as mean_latency
    FROM experiment_logs
    WHERE experiment_id = '${experimentId}' AND quality_score IS NOT NULL
    GROUP BY assigned_variant_id
  `);
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((vals: any[]) => {
    const stat: any = {};
    cols.forEach((c: string, i: number) => stat[c] = vals[i]);
    return stat;
  });
}
