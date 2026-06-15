import api from "./api";

export const questionsService = {
  listByQuestionBank: (questionBankId) => api.get(`/api/question-banks/${questionBankId}/questions`).then((r) => r.data),
  addToQuestionBank: (questionBankId, payload) => api.post(`/api/question-banks/${questionBankId}/questions`, payload).then((r) => r.data),
  update: (questionId, changes) => api.patch(`/api/question-banks/questions/${questionId}`, changes).then((r) => r.data),
};