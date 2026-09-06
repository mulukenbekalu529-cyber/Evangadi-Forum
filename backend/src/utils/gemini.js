import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a vector embedding for a piece of text using Gemini.
 *
 * @param {string} text - The text to embed.
 * @param {'RETRIEVAL_DOCUMENT'|'RETRIEVAL_QUERY'} taskType - How the embedding will be used.
 * @returns {Promise<number[]>} The embedding vector.
 */
export const generateEmbedding = async (
  text,
  taskType = "RETRIEVAL_DOCUMENT",
) => {
  const result = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: { taskType },
  });

  return result.embeddings[0].values;
};
