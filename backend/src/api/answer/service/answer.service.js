import { safeExecute } from "../../../../db/config.js";
import { BadRequestError, NotFoundError } from "../../../utils/errors/index.js";

export const createAnswerService = async ({ questionId, content, userId }) => {
  // 1. Check if the question exists
  const questionSql = `
    SELECT question_id, user_id
    FROM questions
    WHERE question_id = ?
    LIMIT 1
  `;

  const questionRows = await safeExecute(questionSql, [questionId]);

  if (questionRows.length === 0) {
    throw new NotFoundError("Question not found.");
  }

  // 2. Prevent the question owner from answering their own question
  const question = questionRows[0];

  if (Number(question.user_id) === Number(userId)) {
    throw new BadRequestError("You cannot answer your own question.");
  }

  // 3. Insert the answer
  const insertSql = `
    INSERT INTO answers
      (question_id, user_id, content)
    VALUES (?, ?, ?)
  `;

  const result = await safeExecute(insertSql, [questionId, userId, content]);

  // 4. Get the newly created answer with author information
  const answerSql = `
    SELECT
      a.answer_id,
      a.question_id,
      a.content,
      a.created_at,
      a.updated_at,
      u.user_id,
      u.first_name,
      u.last_name
    FROM answers a
    JOIN users u
      ON a.user_id = u.user_id
    WHERE a.answer_id = ?
    LIMIT 1
  `;

  const [answer] = await safeExecute(answerSql, [result.insertId]);

  if (!answer) {
    throw new NotFoundError("Created answer not found.");
  }

  // 5. Return the answer
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
