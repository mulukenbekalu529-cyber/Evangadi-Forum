import { apiClient } from "./core/api.client.js";

export const getQuestions = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await apiClient.get(
    `/api/questions${query ? `?${query}` : ""}`,
  );
  return response.data;
};

export const searchQuestionsSemantic = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await apiClient.get(
    `/api/questions/search${query ? `?${query}` : ""}`,
  );
  return response.data;
};

// T-15: Create Question

export const createQuestion = async ({ title, content }) => {
  const response = await apiClient.post("/api/questions", {
    title,
    content,
  });

  return response.data;
};

// T-15: AI Question Draft Coach
export const generateQuestionDraftCoach = async ({ title, content }) => {
  const response = await apiClient.post("/api/questions/draft-coach", {
    title,
    content,
  });

  return response.data;
};
