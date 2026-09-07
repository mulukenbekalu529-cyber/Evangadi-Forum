import express from "express";

import {
  createQuestionController,
  getQuestionsController,
  getSingleQuestionController,
  searchQuestionsSemanticController,
  getSimilarQuestionsController,
  generateQuestionDraftCoachController,
  assessAnswerAgainstQuestionController,
} from "../controller/question.controller.js";

import {
  createQuestionValidation,
  getQuestionsValidation,
  getSingleQuestionValidation,
  searchQuestionsValidation,
  similarQuestionsValidation,
  generateQuestionDraftCoachValidation,
  assessAnswerAgainstQuestionValidation,
} from "../validations/question.validation.js";

import { authenticateUser } from "../../../middleware/authentication.js";

const router = express.Router();

/*
==================================================
T-09
CREATE QUESTION
POST /api/questions
==================================================
*/

router.post(
  "/",
  authenticateUser,
  createQuestionValidation,
  createQuestionController,
);

/*
==================================================
T-10
LIST QUESTIONS
GET /api/questions
==================================================
*/

router.get(
  "/",
  authenticateUser,
  getQuestionsValidation,
  getQuestionsController,
);

/*
==================================================
T-17
AI QUESTION DRAFT COACH
POST /api/questions/draft-coach
==================================================

IMPORTANT:
This route must be BEFORE /:questionHash
*/

router.post(
  "/draft-coach",
  authenticateUser,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController,
);

/*
==================================================
T-11
SEMANTIC SEARCH
GET /api/questions/search
==================================================
*/

router.get(
  "/search",
  authenticateUser,
  searchQuestionsValidation,
  searchQuestionsSemanticController,
);

/*
==================================================
T-18
AI ANSWER FIT
POST /api/questions/:questionHash/answer-fit
==================================================
*/

router.post(
  "/:questionHash/answer-fit",
  authenticateUser,
  assessAnswerAgainstQuestionValidation,
  assessAnswerAgainstQuestionController,
);

/*
==================================================
T-11
SIMILAR QUESTIONS
GET /api/questions/:questionHash/similar
==================================================
*/

router.get(
  "/:questionHash/similar",
  authenticateUser,
  similarQuestionsValidation,
  getSimilarQuestionsController,
);

/*
==================================================
T-10
SINGLE QUESTION
GET /api/questions/:questionHash
==================================================
*/

router.get(
  "/:questionHash",
  authenticateUser,
  getSingleQuestionValidation,
  getSingleQuestionController,
);

export default router;
