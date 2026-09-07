import { StatusCodes } from "http-status-codes";

import {
  createQuestionWithVectorService,
  getQuestionsService,
  getSingleQuestionService,
  searchQuestionsSemanticService,
  getSimilarQuestionsService,
} from "../service/question.service.js";

// T-09 Create Question
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

// T-10 List Questions
export const getQuestionsController = async (req, res, next) => {
  try {
    const { search, mine } = req.query;

    const userId = req.user.id;

    const result = await getQuestionsService({
      search,
      mine,
      userId,
    });

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

// T-10 Single Question
export const getSingleQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;

    const result = await getSingleQuestionService(questionHash);

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

// T-11 Semantic Search
export const searchQuestionsSemanticController = async (req, res, next) => {
  try {
    const { query, k, threshold } = req.query;

    const data = await searchQuestionsSemanticService({
      query,
      k: k ? Number(k) : undefined,
      threshold: threshold ? Number(threshold) : undefined,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Semantic search completed successfully",

      data,

      meta: {
        total: data.length,
        k: k ? Number(k) : 5,
        threshold: threshold ? Number(threshold) : 0.75,
        query,
        questionHash: null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// T-11 Similar Questions
export const getSimilarQuestionsController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;

    const { k, threshold } = req.query;

    const data = await getSimilarQuestionsService({
      questionHash,
      k: k ? Number(k) : undefined,
      threshold: threshold ? Number(threshold) : undefined,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Similar questions fetched successfully",

      data,

      meta: {
        total: data.length,
        k: k ? Number(k) : 5,
        threshold: threshold ? Number(threshold) : 0.75,
        query: null,
        questionHash,
      },
    });
  } catch (error) {
    next(error);
  }
};
