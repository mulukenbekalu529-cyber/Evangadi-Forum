/**
 * Computes cosine similarity between two equal-length numeric vectors.
 * Returns a value between -1 and 1 (in practice, 0-1 for embeddings).
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
export const cosineSimilarity = (a, b) => {
  if (
    !Array.isArray(a) ||
    !Array.isArray(b) ||
    a.length === 0 ||
    a.length !== b.length
  ) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
