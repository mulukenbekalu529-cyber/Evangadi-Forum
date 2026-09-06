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

router.post(
  "/",
  authenticateUser,
  createQuestionValidation,
  createQuestionController,
);
router.get(
  "/",
  authenticateUser,
  getQuestionsValidation,
  getQuestionsController,
);

// IMPORTANT: /search must be registered BEFORE /:questionHash, otherwise Express
// would match "search" as a questionHash value and this route would never run.
router.get(
  "/search",
  authenticateUser,
  searchQuestionsValidation,
  searchQuestionsSemanticController,
);

router.get(
  "/:questionHash/similar",
  authenticateUser,
  similarQuestionsValidation,
  getSimilarQuestionsController,
);

router.get(
  "/:questionHash",
  authenticateUser,
  getSingleQuestionValidation,
  getSingleQuestionController,
);

export default router;
