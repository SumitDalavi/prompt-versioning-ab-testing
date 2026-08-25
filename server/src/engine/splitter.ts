/**
 * Consistent hashing function to route traffic predictably.
 * For a given session ID, they should always land in the same bucket.
 */
export function getVariantAssignment(sessionId: string, variantAId: string, variantBId: string, splitPercentageA: number): string {
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = ((hash << 5) - hash) + sessionId.charCodeAt(i);
    hash |= 0; 
  }
  
  // Normalize to 0-99
  const bucket = Math.abs(hash) % 100;
  
  if (bucket < splitPercentageA) {
    return variantAId;
  }
  return variantBId;
}
