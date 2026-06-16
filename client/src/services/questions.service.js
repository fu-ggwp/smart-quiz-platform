import axiosClient from "./axiosClient";

export const questionsService = {
  getOne: (questionId) => axiosClient.get(`/api/question-banks/questions/${questionId}`).then((r) => r.data),
  listByQuestionBank: (questionBankId) => axiosClient.get(`/api/question-banks/${questionBankId}/questions`).then((r) => r.data),
  addToQuestionBank: (questionBankId, payload) => axiosClient.post(`/api/question-banks/${questionBankId}/questions`, payload).then((r) => r.data),
  update: (questionId, changes) => axiosClient.patch(`/api/question-banks/questions/${questionId}`, changes).then((r) => r.data),
};
