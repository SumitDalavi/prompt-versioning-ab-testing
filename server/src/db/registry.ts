import { getDb } from './init';
import { v4 as uuidv4 } from 'uuid';

export async function createPrompt(name: string) {
  const db = getDb();
  const id = uuidv4();
  await db.query(`INSERT INTO prompts (id, name) VALUES ($1, $2)`, [id, name]);
  return id;
}

export async function createPromptVersion(promptId: string, systemPrompt: string, model: string, temperature: number, commitMessage: string) {
  const db = getDb();
  const id = uuidv4();
  
  const res = await db.query(`SELECT MAX(version) as max_version FROM prompt_versions WHERE prompt_id = $1`, [promptId]);
  let maxVersion = 0;
  if (res.rows.length > 0 && res.rows[0].max_version !== null) {
    maxVersion = parseInt(res.rows[0].max_version, 10);
  }
  const version = maxVersion + 1;

  await db.query(
    `INSERT INTO prompt_versions (id, prompt_id, version, system_prompt, model, temperature, commit_message) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, promptId, version, systemPrompt, model, temperature, commitMessage]
  );
  return id;
}

export async function createExperiment(name: string, promptId: string, variantA: string, variantB: string, trafficSplitA: number) {
  const db = getDb();
  const id = uuidv4();
  await db.query(
    `INSERT INTO experiments (id, name, prompt_id, variant_a_version_id, variant_b_version_id, traffic_split_a, status, primary_metric) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, name, promptId, variantA, variantB, trafficSplitA, 'running', 'quality_score']
  );
  return id;
}

export async function logExperimentInteraction(experimentId: string, sessionId: string, assignedVariantId: string, latencyMs: number) {
  const db = getDb();
  const id = uuidv4();
  await db.query(
    `INSERT INTO experiment_logs (id, experiment_id, session_id, assigned_variant_id, latency_ms) VALUES ($1, $2, $3, $4, $5)`,
    [id, experimentId, sessionId, assignedVariantId, latencyMs]
  );
  return id;
}

export async function updateExperimentLogQuality(logId: string, qualityScore: number) {
  const db = getDb();
  await db.query(`UPDATE experiment_logs SET quality_score = $1 WHERE id = $2`, [qualityScore, logId]);
}

export async function getActiveExperiment(promptId: string) {
  const db = getDb();
  const res = await db.query(`SELECT * FROM experiments WHERE prompt_id = $1 AND status = 'running' LIMIT 1`, [promptId]);
  if (res.rows.length === 0) return null;
  return res.rows[0];
}

export async function getPromptVersion(versionId: string) {
  const db = getDb();
  const res = await db.query(`SELECT * FROM prompt_versions WHERE id = $1`, [versionId]);
  if (res.rows.length === 0) return null;
  return res.rows[0];
}

export async function getAllExperiments() {
  const db = getDb();
  const res = await db.query(`SELECT * FROM experiments ORDER BY created_at DESC`);
  return res.rows;
}

export async function getExperimentStats(experimentId: string) {
  const db = getDb();
  const res = await db.query(`
    SELECT assigned_variant_id, COUNT(*) as sample_size, AVG(quality_score) as mean_quality, AVG(latency_ms) as mean_latency
    FROM experiment_logs
    WHERE experiment_id = $1 AND quality_score IS NOT NULL
    GROUP BY assigned_variant_id
  `, [experimentId]);
  return res.rows.map((row: any) => ({
    assigned_variant_id: row.assigned_variant_id,
    sample_size: parseInt(row.sample_size, 10),
    mean_quality: parseFloat(row.mean_quality),
    mean_latency: parseFloat(row.mean_latency)
  }));
}
