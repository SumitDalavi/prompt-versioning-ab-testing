import { getDb } from '../db/init';

// Simple t-test logic since jstat had issues
export function calculateSignificance(experimentId: string) {
  const db = getDb();
  
  // Get raw scores per variant
  const res = db.exec(`
    SELECT assigned_variant_id, quality_score 
    FROM experiment_logs 
    WHERE experiment_id = '${experimentId}' AND quality_score IS NOT NULL
  `);

  if (res.length === 0) return { significant: false, pValue: 1, winner: null };

  const variantScores: Record<string, number[]> = {};
  res[0].values.forEach((row: any[]) => {
    const vId = row[0] as string;
    const score = row[1] as number;
    if (!variantScores[vId]) variantScores[vId] = [];
    variantScores[vId].push(score);
  });

  const variants = Object.keys(variantScores);
  if (variants.length !== 2) return { significant: false, pValue: 1, winner: null };

  const [vA, vB] = variants;
  const scoresA = variantScores[vA];
  const scoresB = variantScores[vB];

  if (scoresA.length < 5 || scoresB.length < 5) return { significant: false, pValue: 1, winner: null };

  const meanA = scoresA.reduce((a,b)=>a+b, 0) / scoresA.length;
  const meanB = scoresB.reduce((a,b)=>a+b, 0) / scoresB.length;
  
  const varA = scoresA.reduce((a,b)=>a + Math.pow(b - meanA, 2), 0) / (scoresA.length - 1);
  const varB = scoresB.reduce((a,b)=>a + Math.pow(b - meanB, 2), 0) / (scoresB.length - 1);

  // Welch's t-test
  const tStat = Math.abs(meanA - meanB) / Math.sqrt((varA/scoresA.length) + (varB/scoresB.length));
  
  // Approximation of p-value for large degrees of freedom (>10)
  // tStat > 1.96 roughly corresponds to p < 0.05 for 95% confidence
  const significant = tStat > 1.96; 
  let winner = null;
  if (significant) {
    winner = meanA > meanB ? vA : vB;
  }

  // Very rough p-value approximation for demo purposes
  const pValue = Math.exp(-0.717 * tStat - 0.416 * Math.pow(tStat, 2));

  return {
    significant,
    pValue: Math.min(1, pValue),
    winner,
    stats: {
      [vA]: { mean: meanA, sampleSize: scoresA.length },
      [vB]: { mean: meanB, sampleSize: scoresB.length }
    }
  };
}
