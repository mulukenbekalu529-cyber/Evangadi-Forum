import express from "express";
import {
  createQuestionController,
  getQuestionsController,
  getSingleQuestionController,
} from "../controller/question.controller.js";
import {
  createQuestionValidation,
  getQuestionsValidation,
  getSingleQuestionValidation,
} from "../validations/question.validation.js";
import { authenticateUser } from "../../../middleware/authentication.js";

const router = express.Router();

/**
 * @route POST /api/questions
 * @desc Create a new question and generate its vector embedding
 * @access Protected
 */
router.post(
  "/",
  authenticateUser,
  createQuestionValidation,
  createQuestionController,
);

/**
 * @route GET /api/questions
 * @desc List questions, optionally filtered by search term or "mine"
 * @access Protected
 */
router.get(
  "/",
  authenticateUser,
  getQuestionsValidation,
  getQuestionsController,
);

/**
 * @route GET /api/questions/:questionHash
 * @desc Get a single question with its answers
 * @access Protected
 */
router.get(
  "/:questionHash",
  authenticateUser,
  getSingleQuestionValidation,
  getSingleQuestionController,
);

export default router;
