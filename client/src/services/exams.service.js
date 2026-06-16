import axiosClient from "./axiosClient";

export const examsService = {
  listMine: (params) => axiosClient.get("/api/exams", { params }).then((r) => r.data),
  listAvailable: (params) => axiosClient.get("/api/exams/learner", { params }).then((r) => r.data),
  listForClass: (classId) => axiosClient.get(`/api/exams/class/${classId}`).then((r) => r.data),
  getOne: (id) => axiosClient.get(`/api/exams/${id}`).then((r) => r.data.data),
  getLearnerExam: (id) => axiosClient.get(`/api/exams/learner/${id}`).then((r) => r.data.data),
  create: (payload) => axiosClient.post("/api/exams", payload).then((r) => r.data),
  updateSettings: (id, changes) =>
    axiosClient.patch(`/api/exams/${id}/settings`, changes).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/api/exams/${id}`).then((r) => r.data),
  listAttempts: (id) => axiosClient.get(`/api/exams/${id}/attempts`).then((r) => r.data),

  // Learner: take exams
  startAttempt: (id) => axiosClient.post(`/api/exams/${id}/attempts`).then((r) => r.data),
  listMyAttempts: () => axiosClient.get("/api/exams/attempts/mine").then((r) => r.data),
  submitAnswer: (attemptId, payload) =>
    axiosClient.post(`/api/exams/attempts/${attemptId}/answers`, payload).then((r) => r.data),
  submitAttempt: (attemptId, score) =>
    axiosClient.patch(`/api/exams/attempts/${attemptId}/submit`, { score }).then((r) => r.data),
  getAttemptResults: (attemptId) =>
    axiosClient.get(`/api/exams/attempts/${attemptId}/results`).then((r) => r.data),
};
