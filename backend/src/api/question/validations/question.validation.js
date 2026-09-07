import { body, query, param } from "express-validator";

import { validationErrorHandler } from "../../../middleware/validation-handler.js";

/*
==================================================
T-09
CREATE QUESTION VALIDATION
==================================================
*/

export const createQuestionValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string")
    .isLength({ min: 5, max: 255 })
    .withMessage("Title must be between 5 and 255 characters"),

  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isString()
    .withMessage("Content must be a string")
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters long"),

  validationErrorHandler,
];

/*
==================================================
T-10
LIST QUESTIONS VALIDATION
==================================================
*/

export const getQuestionsValidation = [
  query("search")
    .optional()
    .isString()
    .withMessage("Search must be a string")
    .trim(),

  query("mine")
    .optional()
    .isBoolean()
    .withMessage("Mine must be a boolean")
    .toBoolean(),

  validationErrorHandler,
];

/*
==================================================
T-10
SINGLE QUESTION VALIDATION
==================================================
*/

export const getSingleQuestionValidation = [
  param("questionHash")
    .matches(/^[a-f0-9]{16}$/)
    .withMessage("Invalid question hash format"),

  validationErrorHandler,
];

/*
==================================================
T-11
COMMON SEARCH VALIDATION
==================================================
*/

const kAndThresholdValidation = [
  query("k")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("k must be an integer between 1 and 20")
    .toInt(),

  query("threshold")
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage("threshold must be a number between 0 and 1")
    .toFloat(),
];

/*
==================================================
T-11
SEMANTIC SEARCH VALIDATION
==================================================
*/

export const searchQuestionsValidation = [
  query("query")
    .notEmpty()
    .withMessage("query is required")
    .isString()
    .withMessage("query must be a string")
    .isLength({ min: 5 })
    .withMessage("query must be at least 5 characters long"),

  ...kAndThresholdValidation,

  validationErrorHandler,
];

/*
==================================================
T-11
SIMILAR QUESTIONS VALIDATION
==================================================
*/

export const similarQuestionsValidation = [
  param("questionHash")
    .matches(/^[a-f0-9]{16}$/)
    .withMessage("Invalid question hash format"),

  ...kAndThresholdValidation,

  validationErrorHandler,
];
