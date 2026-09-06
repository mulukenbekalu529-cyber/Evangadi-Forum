import crypto from "crypto";
import { safeExecute } from "../../../../db/config.js";
import { generateEmbedding } from "../../../utils/gemini.js";
import { NotFoundError } from "../../../utils/errors/index.js";

const generateQuestionHash = () => crypto.randomBytes(8).toString("hex"); // 16 hex chars

/**
 * Inserts a question, then generates and stores its vector embedding.
 * Embedding failures never block question creation — they're recorded
 * with status 'failed' so a later retry job (or T-11) can pick them up.
 */
export const createQuestionWithVectorService = async ({
  title,
  content,
  userId,
}) => {
  const questionHash = generateQuestionHash();

  const insertSql =
    "INSERT INTO questions (question_hash, user_id, title, content) VALUES (?, ?, ?, ?)";
  const result = await safeExecute(insertSql, [
    questionHash,
    userId,
    title,
    content,
  ]);
  const questionId = result.insertId;

  let embedding = null;
  let status = "ready";

  try {
    embedding = await generateEmbedding(title, "RETRIEVAL_DOCUMENT");
  } catch (error) {
    console.error(
      `Embedding failed for question ${questionId}:`,
      error.message,
    );
    embedding = [];
    status = "failed";
  }

  const vectorSql =
    "INSERT INTO question_vectors (question_id, source_text, embedding, status) VALUES (?, ?, ?, ?)";
  await safeExecute(vectorSql, [
    questionId,
    title,
    JSON.stringify(embedding),
    status,
  ]);

  return {
    id: questionId,
    questionHash,
    title,
    content,
    userId,
  };
};

const mapQuestionRow = (row) => ({
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
});

/**
 * Lists questions with optional keyword search and a "mine" filter.
 *
 * @param {Object} params
 * @param {string} [params.search]
 * @param {boolean} [params.mine]
 * @param {number} params.userId - The authenticated user's id (used when mine=true).
 */
export const getQuestionsService = async ({ search, mine, userId }) => {
  const conditions = [];
  const values = [];

  if (mine) {
    conditions.push("q.user_id = ?");
    values.push(userId);
  }

  if (search) {
    conditions.push("(q.title LIKE ? OR q.content LIKE ?)");
    const term = `%${search}%`;
    values.push(term, term);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT q.question_id, q.question_hash, q.title, q.content, q.created_at, q.updated_at,
           u.user_id, u.first_name, u.last_name,
           COUNT(a.answer_id) AS answer_count
    FROM questions q
    JOIN users u ON q.user_id = u.user_id
    LEFT JOIN answers a ON a.question_id = q.question_id
    ${whereClause}
    GROUP BY q.question_id
    ORDER BY q.created_at DESC
    LIMIT 100
  `;

  const rows = await safeExecute(sql, values);
  const data = rows.map(mapQuestionRow);

  return {
    data,
    meta: {
      limit: 100,
      total: data.length,
      sortBy: "newest",
      sortOrder: "desc",
    },
  };
};

/**
 * Fetches a single question (with author) and all of its answers (with authors).
 *
 * @param {string} questionHash
 */
export const getSingleQuestionService = async ({ questionHash }) => {
  const questionSql = `
    SELECT q.question_id, q.question_hash, q.title, q.content, q.created_at, q.updated_at,
           u.user_id, u.first_name, u.last_name,
           (SELECT COUNT(*) FROM answers WHERE question_id = q.question_id) AS answer_count
    FROM questions q
    JOIN users u ON q.user_id = u.user_id
    WHERE q.question_hash = ?
    LIMIT 1
  `;
  const questionRows = await safeExecute(questionSql, [questionHash]);

  if (questionRows.length === 0) {
    throw new NotFoundError("Question not found.");
  }

  const question = mapQuestionRow(questionRows[0]);

  const answersSql = `
    SELECT a.answer_id, a.content, a.created_at, a.updated_at,
           u.user_id, u.first_name, u.last_name
    FROM answers a
    JOIN users u ON a.user_id = u.user_id
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
