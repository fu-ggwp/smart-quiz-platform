import axiosClient from "./axios-client";

// Shared AI API wrapper. Each method returns the backend `data` payload.
export const aiService = {
  generateQuestionsFromMaterial: (payload) =>
    axiosClient.post("/api/ai/questions/from-material", payload).then((r) => r.data.data),
  generateStudySetAnswerExplanation: (sessionId, questionId) =>
    axiosClient
      .post(`/api/ai/study-set-sessions/${sessionId}/questions/${questionId}/explanation`)
      .then((r) => r.data),
};
