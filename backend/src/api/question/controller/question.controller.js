import { StatusCodes } from "http-status-codes";
import {
  createQuestionWithVectorService,
  getQuestionsService,
  getSingleQuestionService,
} from "../service/question.service.js";

/**
 * Handles question creation requests.
 */
export const createQuestionController = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;

    const newQuestion = await createQuestionWithVectorService({
      title,
      content,
      userId,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Question posted successfully.",
      data: newQuestion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles listing questions, with optional search and "mine" filters.
 */
export const getQuestionsController = async (req, res, next) => {
  try {
    const { search, mine } = req.query;
    const userId = req.user.id;

    const result = await getQuestionsService({ search, mine, userId });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Questions fetched successfully.",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles fetching a single question and its answers.
 */
export const getSingleQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;

    const result = await getSingleQuestionService({ questionHash });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Question fetched successfully",
      question: result.question,
      answers: result.answers,
      answersMeta: result.answersMeta,
    });
  } catch (error) {
    next(error);
  }
};
