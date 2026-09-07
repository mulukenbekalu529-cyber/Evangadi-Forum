import { StatusCodes } from "http-status-codes";

import {
  createQuestionWithVectorService,
  getQuestionsService,
  getSingleQuestionService,
  searchQuestionsSemanticService,
  getSimilarQuestionsService,
} from "../service/question.service.js";

import {
  generateQuestionDraftCoachService,
  assessAnswerAgainstQuestionService,
} from "../service/geminiTextCoach.service.js";

/*
==================================================
T-09
CREATE QUESTION
==================================================
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

/*
==================================================
T-10
LIST QUESTIONS
==================================================
*/

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

/*
==================================================
T-10
GET SINGLE QUESTION
==================================================
*/

export const getSingleQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;

    const result = await getSingleQuestionService({
      questionHash,
    });

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

/*
==================================================
T-11
SEMANTIC SEARCH
==================================================
*/

export const searchQuestionsSemanticController = async (req, res, next) => {
  try {
    const { query: searchQuery, k, threshold } = req.query;

    const result = await searchQuestionsSemanticService({
      searchQuery,
      k,
      threshold,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Semantic search completed successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

/*
==================================================
T-11
SIMILAR QUESTIONS
==================================================
*/

export const getSimilarQuestionsController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;

    const { k, threshold } = req.query;

    const result = await getSimilarQuestionsService({
      questionHash,
      k,
      threshold,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Similar questions fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

/*
==================================================
T-17
AI QUESTION DRAFT COACH
==================================================
*/

export const generateQuestionDraftCoachController = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const result = await generateQuestionDraftCoachService({
      title,
      content,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Draft suggestions generated",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/*
==================================================
T-18
AI ANSWER FIT
==================================================
*/

export const assessAnswerAgainstQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;

    const { answerText } = req.body;

    const result = await assessAnswerAgainstQuestionService({
      questionHash,
      answerText,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answer fit assessed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
