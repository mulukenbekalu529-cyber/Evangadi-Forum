import { safeExecute } from "../../../../db/config.js";
import { BadRequestError, NotFoundError } from "../../../utils/errors/index.js";

/**
 * Creates an answer for a question, after verifying the question exists
 * and the answering user isn't the question's own author.
 *
 * @param {Object} params
 * @param {number} params.questionId
 * @param {string} params.content
 * @param {number} params.userId
 * @returns {Promise<Object>} The created answer, including author info.
 */
export const createAnswerService = async ({ questionId, content, userId }) => {
  const questionSql =
    "SELECT question_id, user_id FROM questions WHERE question_id = ? LIMIT 1";
  const questionRows = await safeExecute(questionSql, [questionId]);

  if (questionRows.length === 0) {
    throw new NotFoundError("Question not found.");
  }

  const question = questionRows[0];
  if (question.user_id === userId) {
    throw new BadRequestError("You cannot answer your own question.");
  }

  const insertSql =
    "INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)";
  const result = await safeExecute(insertSql, [questionId, userId, content]);

  const answerSql = `
    SELECT a.answer_id, a.question_id, a.content, a.created_at, a.updated_at,
           u.user_id, u.first_name, u.last_name
    FROM answers a
    JOIN users u ON a.user_id = u.user_id
    WHERE a.answer_id = ?
    LIMIT 1
  `;
  const [answer] = await safeExecute(answerSql, [result.insertId]);

  return {
    id: answer.answer_id,
    questionId: answer.question_id,
    content: answer.content,
    createdAt: answer.created_at,
    updatedAt: answer.updated_at,
    author: {
      id: answer.user_id,
      firstName: answer.first_name,
      lastName: answer.last_name,
    },
  };
};
