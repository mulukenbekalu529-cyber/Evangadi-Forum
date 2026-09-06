import { StatusCodes } from "http-status-codes";
import { createAnswerService } from "../service/answer.service.js";

/**
 * Handles answer creation requests.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const createAnswerController = async (req, res, next) => {
  try {
    const { questionId, content } = req.body;
    const userId = req.user.id;

    const newAnswer = await createAnswerService({
      questionId,
      content,
      userId,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Answer posted successfully",
      data: newAnswer,
    });
  } catch (error) {
    next(error);
  }
};
