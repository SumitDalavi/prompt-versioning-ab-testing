import { ChatOpenAI } from "@langchain/openai";
import { updateExperimentLogQuality } from "../db/registry";
import { z } from "zod";

const EvaluationSchema = z.object({
  score: z.number().min(1).max(5).describe("Quality score from 1 to 5")
});

export async function evaluateResponseQuality(logId: string, systemPrompt: string, userMessage: string, responseContent: string) {
  try {
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.1,
    }).withStructuredOutput(EvaluationSchema);

    const prompt = `You are evaluating an LLM response based on its helpfulness, relevance, and accuracy.
System Prompt used: ${systemPrompt}
User input: ${userMessage}
Model response: ${responseContent}

Rate the response from 1 to 5, where 1 is terrible/unhelpful, and 5 is excellent/perfect.`;

    const result = await model.invoke([
      ["system", prompt]
    ]);

    await updateExperimentLogQuality(logId, result.score);
  } catch (err) {
    console.error("Evaluation failed for log " + logId, err);
  }
}
