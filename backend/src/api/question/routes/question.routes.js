import express from "express";

import {
  createQuestionController,
  getQuestionsController,
  getSingleQuestionController,
  searchQuestionsSemanticController,
  getSimilarQuestionsController,
} from "../controller/question.controller.js";

import {
  createQuestionValidation,
  getQuestionsValidation,
  getSingleQuestionValidation,
  searchQuestionsValidation,
  similarQuestionsValidation,
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
T-11
SEMANTIC SEARCH
IMPORTANT:
This must come before /:questionHash
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
