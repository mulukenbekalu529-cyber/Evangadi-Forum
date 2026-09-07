import crypto from "crypto";

import { safeExecute } from "../../../../db/config.js";
import { generateEmbedding } from "../../../utils/gemini.js";
import { cosineSimilarity } from "../../../utils/vector.js";
import { NotFoundError } from "../../../utils/errors/index.js";

const DEFAULT_K = 5;
const DEFAULT_THRESHOLD = Number(process.env.RECOMMEND_THRESHOLD) || 0.75;

// Generate a unique 16-character hash
const generateQuestionHash = () => {
  return crypto.randomBytes(8).toString("hex");
};

// Convert embedding into an array
const parseEmbedding = (embedding) => {
  if (Array.isArray(embedding)) {
    return embedding.map(Number);
  }

  if (typeof embedding === "string") {
    const parsed = JSON.parse(embedding);

    if (!Array.isArray(parsed)) {
      throw new Error("Embedding is not a valid array.");
    }

    return parsed.map(Number);
  }

  throw new Error("Invalid embedding data.");
};

// Convert database row to API format
const mapQuestionRow = (row) => {
  return {
    id: row.question_id,
    questionHash: row.question_hash,
    title: row.title,
    content: row.content,
    answerCount: Number(row.answer_count) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    author: {
      id: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
    },
  };
};

/*
==================================================
T-09 CREATE QUESTION + EMBEDDING
==================================================
*/

export const createQuestionWithVectorService = async ({
  title,
  content,
  userId,
}) => {
  const questionHash = generateQuestionHash();

  const insertQuestionSql = `
    INSERT INTO questions
      (question_hash, title, content, user_id)
    VALUES (?, ?, ?, ?)
  `;

  // safeExecute returns the result directly
  const questionResult = await safeExecute(insertQuestionSql, [
    questionHash,
    title,
    content,
    userId,
  ]);

  const questionId = questionResult.insertId;

  const sourceText = `${title}\n${content}`;

  try {
    const embedding = await generateEmbedding(sourceText, "RETRIEVAL_DOCUMENT");

    const insertVectorSql = `
      INSERT INTO question_vectors
        (question_id, source_text, embedding, status)
      VALUES (?, ?, ?, ?)
    `;

    await safeExecute(insertVectorSql, [
      questionId,
      sourceText,
      JSON.stringify(embedding),
      "ready",
    ]);
  } catch (error) {
    console.error("Embedding generation failed:", error);

    const failedVectorSql = `
      INSERT INTO question_vectors
        (question_id, source_text, embedding, status)
      VALUES (?, ?, ?, ?)
    `;

    await safeExecute(failedVectorSql, [
      questionId,
      sourceText,
      JSON.stringify([]),
      "failed",
    ]);
  }

  return {
    id: questionId,
    questionHash,
    title,
    content,
    userId,
  };
};

/*
==================================================
T-10 LIST QUESTIONS
==================================================
*/

export const getQuestionsService = async ({
  search = "",
  mine = false,
  userId,
  page = 1,
  limit = 100,
}) => {
  const offset = (page - 1) * limit;

  let sql = `
    SELECT
      q.question_id,
      q.question_hash,
      q.title,
      q.content,
      q.user_id,
      q.created_at,
      q.updated_at,
      u.first_name,
      u.last_name,
      COUNT(a.answer_id) AS answer_count

    FROM questions q

    LEFT JOIN users u
      ON q.user_id = u.user_id

    LEFT JOIN answers a
      ON q.question_id = a.question_id

    WHERE 1 = 1
  `;

  const params = [];

  // Search by title or content
  if (search) {
    sql += `
      AND (
        q.title LIKE ?
        OR q.content LIKE ?
      )
    `;

    params.push(`%${search}%`, `%${search}%`);
  }

  // Get only current user's questions
  if (mine === true) {
    sql += `
      AND q.user_id = ?
    `;

    params.push(userId);
  }

  sql += `
    GROUP BY
      q.question_id,
      q.question_hash,
      q.title,
      q.content,
      q.user_id,
      q.created_at,
      q.updated_at,
      u.first_name,
      u.last_name

    ORDER BY q.created_at DESC

    LIMIT ? OFFSET ?
  `;

  params.push(Number(limit), Number(offset));

  // IMPORTANT:
  // safeExecute returns rows directly
  const rows = await safeExecute(sql, params);

  return {
    data: rows.map(mapQuestionRow),

    meta: {
      limit: Number(limit),
      total: rows.length,
      sortBy: "newest",
      sortOrder: "desc",
    },
  };
};

/*
==================================================
T-10 SINGLE QUESTION
==================================================
*/

export const getSingleQuestionService = async (questionHash) => {
  const questionSql = `
    SELECT
      q.question_id,
      q.question_hash,
      q.title,
      q.content,
      q.user_id,
      q.created_at,
      q.updated_at,
      u.first_name,
      u.last_name,
      COUNT(a.answer_id) AS answer_count

    FROM questions q

    LEFT JOIN users u
      ON q.user_id = u.user_id

    LEFT JOIN answers a
      ON q.question_id = a.question_id

    WHERE q.question_hash = ?

    GROUP BY
      q.question_id,
      q.question_hash,
      q.title,
      q.content,
      q.user_id,
      q.created_at,
      q.updated_at,
      u.first_name,
      u.last_name

    LIMIT 1
  `;

  const questionRows = await safeExecute(questionSql, [questionHash]);

  if (!questionRows.length) {
    throw new NotFoundError("Question not found.");
  }

  const question = mapQuestionRow(questionRows[0]);

  // Get answers
  const answersSql = `
    SELECT
      a.answer_id,
      a.content,
      a.created_at,
      a.updated_at,
      a.user_id,
      u.first_name,
      u.last_name

    FROM answers a

    LEFT JOIN users u
      ON a.user_id = u.user_id

    WHERE a.question_id = ?

    ORDER BY a.created_at ASC
  `;

  const answerRows = await safeExecute(answersSql, [question.id]);

  const answers = answerRows.map((row) => ({
    id: row.answer_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    author: {
      id: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
    },
  }));

  return {
    question,
    answers,

    answersMeta: {
      limit: 100,
      total: answers.length,
    },
  };
};

/*
==================================================
HYDRATE SEARCH RESULTS
==================================================
*/

const hydrateScoredQuestions = async (scoredQuestions) => {
  if (!scoredQuestions.length) {
    return [];
  }

  const questionIds = scoredQuestions.map((item) => item.question_id);

  const placeholders = questionIds.map(() => "?").join(",");

  const sql = `
    SELECT
      q.question_id,
      q.question_hash,
      q.title,
      q.content,
      q.user_id,
      q.created_at,
      q.updated_at,
      u.first_name,
      u.last_name,
      COUNT(a.answer_id) AS answer_count

    FROM questions q

    LEFT JOIN users u
      ON q.user_id = u.user_id

    LEFT JOIN answers a
      ON q.question_id = a.question_id

    WHERE q.question_id IN (${placeholders})

    GROUP BY
      q.question_id,
      q.question_hash,
      q.title,
      q.content,
      q.user_id,
      q.created_at,
      q.updated_at,
      u.first_name,
      u.last_name
  `;

  const rows = await safeExecute(sql, questionIds);

  const questionMap = new Map();

  rows.forEach((row) => {
    questionMap.set(row.question_id, mapQuestionRow(row));
  });

  return scoredQuestions
    .map((item) => {
      const question = questionMap.get(item.question_id);

      if (!question) {
        return null;
      }

      return {
        ...question,
        score: Number(item.score.toFixed(6)),
      };
    })
    .filter(Boolean);
};

/*
==================================================
T-11 SEMANTIC SEARCH
==================================================
*/

export const searchQuestionsSemanticService = async ({
  query,
  k = DEFAULT_K,
  threshold = DEFAULT_THRESHOLD,
}) => {
  // Create embedding for user's search query
  const queryEmbedding = await generateEmbedding(query, "RETRIEVAL_QUERY");

  const cleanQueryEmbedding = parseEmbedding(queryEmbedding);

  // Get all ready embeddings
  const vectorsSql = `
    SELECT
      question_id,
      embedding

    FROM question_vectors

    WHERE status = ?
  `;

  const vectorRows = await safeExecute(vectorsSql, ["ready"]);

  const scoredQuestions = [];

  // Calculate similarity
  for (const row of vectorRows) {
    try {
      const storedEmbedding = parseEmbedding(row.embedding);

      const score = cosineSimilarity(cleanQueryEmbedding, storedEmbedding);

      if (!Number.isFinite(score)) {
        continue;
      }

      if (score >= threshold) {
        scoredQuestions.push({
          question_id: row.question_id,
          score,
        });
      }
    } catch (error) {
      console.error(
        `Could not parse embedding for question ${row.question_id}:`,
        error.message,
      );
    }
  }

  // Highest score first
  scoredQuestions.sort((a, b) => b.score - a.score);

  const topQuestions = scoredQuestions.slice(0, Number(k));

  return hydrateScoredQuestions(topQuestions);
};

/*
==================================================
T-11 SIMILAR QUESTIONS
==================================================
*/

export const getSimilarQuestionsService = async ({
  questionHash,
  k = DEFAULT_K,
  threshold = DEFAULT_THRESHOLD,
}) => {
  // Find the source question
  const questionSql = `
    SELECT
      question_id

    FROM questions

    WHERE question_hash = ?

    LIMIT 1
  `;

  const questionRows = await safeExecute(questionSql, [questionHash]);

  if (!questionRows.length) {
    throw new NotFoundError("Question not found.");
  }

  const questionId = questionRows[0].question_id;

  // Get source embedding
  const sourceVectorSql = `
    SELECT
      embedding,
      status

    FROM question_vectors

    WHERE question_id = ?

    LIMIT 1
  `;

  const sourceRows = await safeExecute(sourceVectorSql, [questionId]);

  if (!sourceRows.length) {
    throw new NotFoundError("Embedding for this question was not found.");
  }

  if (sourceRows[0].status !== "ready") {
    throw new Error("Embedding for this question is not ready.");
  }

  const sourceEmbedding = parseEmbedding(sourceRows[0].embedding);

  // Get other question embeddings
  const otherVectorsSql = `
    SELECT
      question_id,
      embedding

    FROM question_vectors

    WHERE status = ?
      AND question_id != ?
  `;

  const otherVectorRows = await safeExecute(otherVectorsSql, [
    "ready",
    questionId,
  ]);

  const scoredQuestions = [];

  // Calculate similarity
  for (const row of otherVectorRows) {
    try {
      const storedEmbedding = parseEmbedding(row.embedding);

      const score = cosineSimilarity(sourceEmbedding, storedEmbedding);

      if (!Number.isFinite(score)) {
        continue;
      }

      if (score >= threshold) {
        scoredQuestions.push({
          question_id: row.question_id,
          score,
        });
      }
    } catch (error) {
      console.error(
        `Could not parse embedding for question ${row.question_id}:`,
        error.message,
      );
    }
  }

  // Highest score first
  scoredQuestions.sort((a, b) => b.score - a.score);

  const topQuestions = scoredQuestions.slice(0, Number(k));

  return hydrateScoredQuestions(topQuestions);
};
