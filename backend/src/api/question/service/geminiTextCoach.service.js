import { GoogleGenAI } from "@google/genai";

import { safeExecute } from "../../../../db/config.js";

import { NotFoundError } from "../../../utils/errors/index.js";

/*
==================================================
GEMINI CONFIGURATION
==================================================
*/

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-3.6-flash";

/*
==================================================
HELPER
Parse JSON returned by Gemini
==================================================
*/

const parseJsonResponse = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("Invalid JSON response from Gemini.");
    }

    return JSON.parse(match[0]);
  }
};

/*
==================================================
T-17
AI QUESTION DRAFT COACH
==================================================
*/

export const generateQuestionDraftCoachService = async ({ title, content }) => {
  const prompt = `
You are an AI coach for a programming and software engineering forum.

Review the following question draft.

Title:
${title || "(No title provided)"}

Content:
${content}

Evaluate:

1. Clarity of the question
2. Whether enough technical information is provided
3. Whether error messages should be included
4. Whether code examples should be included
5. Whether the question is specific enough
6. How the user can improve the question

Return ONLY valid JSON using exactly this format:

{
  "feedback": "short helpful feedback",
  "suggestions": [
    "suggestion 1",
    "suggestion 2",
    "suggestion 3"
  ]
}

Do not use markdown.
Do not include any text outside the JSON.
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const text = response.text;

  const result = parseJsonResponse(text);

  return {
    feedback: result.feedback || "",

    suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
  };
};

/*
==================================================
T-18
AI ANSWER FIT EVALUATION
==================================================
*/

export const assessAnswerAgainstQuestionService = async ({
  questionHash,
  answerText,
}) => {
  /*
  ----------------------------------------------
  1. Find question
  ----------------------------------------------
  */

  const questionSql = `
    SELECT
      question_id,
      title,
      content
    FROM questions
    WHERE question_hash = ?
    LIMIT 1
  `;

  const rows = await safeExecute(questionSql, [questionHash]);

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new NotFoundError("Question not found.");
  }

  const question = rows[0];

  /*
  ----------------------------------------------
  2. Create AI prompt
  ----------------------------------------------
  */

  const prompt = `
You are an AI evaluator for a programming and software engineering forum.

Evaluate how well the draft answer addresses the original question.

Original Question Title:
${question.title}

Original Question:
${question.content}

Draft Answer:
${answerText}

Classify the answer into exactly one of these levels:

strong:
The answer directly addresses the question and explains the main issue.

partial:
The answer addresses some part of the question but misses important information.

weak:
The answer does not properly answer the question or is mostly irrelevant.

Return ONLY valid JSON in exactly this format:

{
  "level": "strong",
  "note": "Short explanation of why the answer fits the question."
}

The level MUST be exactly one of:

strong
partial
weak

Do not use markdown.
Do not include any text outside the JSON.
`;

  /*
  ----------------------------------------------
  3. Call Gemini
  ----------------------------------------------
  */

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const text = response.text;

  /*
  ----------------------------------------------
  4. Parse response
  ----------------------------------------------
  */

  const result = parseJsonResponse(text);

  /*
  ----------------------------------------------
  5. Validate AI result
  ----------------------------------------------
  */

  const allowedLevels = ["strong", "partial", "weak"];

  const level = allowedLevels.includes(result.level) ? result.level : "partial";

  return {
    level,
    note: result.note || "The answer was evaluated against the question.",
  };
};
