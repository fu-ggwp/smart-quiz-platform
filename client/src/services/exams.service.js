import api from "./api";

export const examsService = {
  listMine: (params) => api.get("/api/exams", { params }).then((r) => r.data),
  listForClass: (classId) => api.get(`/api/exams/class/${classId}`).then((r) => r.data),
  getOne: (id) => api.get(`/api/exams/${id}`).then((r) => r.data),
  create: (payload) => api.post("/api/exams", payload).then((r) => r.data),
  update: (id, changes) => api.patch(`/api/exams/${id}`, changes).then((r) => r.data),
  remove: (id) => api.delete(`/api/exams/${id}`).then((r) => r.data),
  listAttempts: (id) => api.get(`/api/exams/${id}/attempts`).then((r) => r.data),

  // Learner: take exams
  startAttempt: (id) => api.post(`/api/exams/${id}/attempts`).then((r) => r.data),
  listMyAttempts: () => api.get("/api/exams/attempts/mine").then((r) => r.data),
  submitAnswer: (attemptId, payload) =>
    api.post(`/api/exams/attempts/${attemptId}/answers`, payload).then((r) => r.data),
  submitAttempt: (attemptId, score) =>
    api.patch(`/api/exams/attempts/${attemptId}/submit`, { score }).then((r) => r.data),
  getAttemptResults: (attemptId) =>
    api.get(`/api/exams/attempts/${attemptId}/results`).then((r) => r.data),
};
