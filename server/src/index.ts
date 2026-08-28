import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db/init';
import { ChatOpenAI } from "@langchain/openai";
import { getVariantAssignment } from './engine/splitter';
import { evaluateResponseQuality } from './analytics/evaluator';
import { calculateSignificance } from './analytics/stats';
import {
  createPrompt, createPromptVersion, createExperiment, 
  logExperimentInteraction, getActiveExperiment, 
  getPromptVersion, getAllExperiments, getExperimentStats
} from './db/registry';

const app = express();
app.use(cors());
app.use(express.json());

// --- REGISTRY ENDPOINTS ---

app.post('/api/v1/prompts', async (req, res) => {
  try {
    const { name, systemPrompt, model, temperature, commitMessage } = req.body;
    const promptId = await createPrompt(name);
    await createPromptVersion(promptId, systemPrompt, model || 'gpt-4o-mini', temperature || 0.7, commitMessage || 'Initial commit');
    res.json({ promptId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v1/prompts/:id/versions', async (req, res) => {
  try {
    const promptId = req.params.id;
    const { systemPrompt, model, temperature, commitMessage } = req.body;
    const versionId = await createPromptVersion(promptId, systemPrompt, model, temperature, commitMessage);
    res.json({ versionId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- EXPERIMENT ENDPOINTS ---

app.post('/api/v1/experiments', async (req, res) => {
  try {
    const { name, promptId, variantA, variantB, trafficSplitA } = req.body;
    const expId = await createExperiment(name, promptId, variantA, variantB, trafficSplitA);
    res.json({ expId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/v1/experiments', async (req, res) => {
  try {
    const experiments = await getAllExperiments();
    res.json({ experiments });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/v1/experiments/:id/stats', async (req, res) => {
  try {
    const expId = req.params.id;
    const basicStats = await getExperimentStats(expId);
    const significance = await calculateSignificance(expId);
    res.json({ basicStats, significance });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- SERVING ENDPOINT ---

app.post('/api/v1/completions', async (req, res) => {
  const { promptId, sessionId, userMessage } = req.body;
  if (!promptId || !sessionId || !userMessage) return res.status(400).json({ error: "Missing required fields" });

  try {
    // 1. Resolve variant
    const activeExperiment = await getActiveExperiment(promptId);
    let targetVersionId;
    let expId = null;

    if (activeExperiment) {
      targetVersionId = getVariantAssignment(sessionId, activeExperiment.variant_a_version_id, activeExperiment.variant_b_version_id, activeExperiment.traffic_split_a);
      expId = activeExperiment.id;
    } else {
      // In a real app, we'd have an 'active_version' pointer. 
      // For this demo, if no experiment, error out to force them to run experiments.
      return res.status(400).json({ error: "No active experiment for this prompt." });
    }

    const version = await getPromptVersion(targetVersionId);
    if (!version) return res.status(404).json({ error: "Version not found" });

    // 2. Call LLM
    const start = Date.now();
    const model = new ChatOpenAI({
      modelName: version.model,
      temperature: version.temperature,
    });
    
    // Quick template substitution if any
    const finalSystemPrompt = version.system_prompt; 
    
    const response = await model.invoke([
      ["system", finalSystemPrompt],
      ["user", userMessage]
    ]);
    const latency = Date.now() - start;

    // 3. Log interaction
    const logId = await logExperimentInteraction(expId, sessionId, targetVersionId, latency);

    // 4. Async trigger evaluator
    evaluateResponseQuality(logId, finalSystemPrompt, userMessage, response.content as string).catch(console.error);

    res.json({
      content: response.content,
      variantId: targetVersionId,
      experimentId: expId,
      latencyMs: latency
    });

  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4002;

if (require.main === module) {
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`A/B Testing Platform API running on port ${PORT}`);
    });
  });
}

export { app, initDb };
