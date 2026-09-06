import { body } from "express-validator";
import { validationErrorHandler } from "../../../middleware/validation-handler.js";

export const createAnswerValidation = [
  body("questionId")
    .notEmpty()
    .withMessage("Question ID is required")
    .isInt({ min: 1 })
    .withMessage("Question ID must be a valid integer")
    .toInt(),
  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isString()
    .withMessage("Content must be a string")
    .isLength({ min: 20 })
    .withMessage("Content must be at least 20 characters long"),

  validationErrorHandler,
];
