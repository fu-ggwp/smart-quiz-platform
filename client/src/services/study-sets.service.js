import api from "./api";

export const studySetsService = {
  listMine: () => api.get("/api/study-sets/mine").then((r) => r.data),
  listAvailable: (params) => api.get("/api/study-sets", { params }).then((r) => r.data),
  getOne: (id) => api.get(`/api/study-sets/${id}`).then((r) => r.data),
  create: (payload) => api.post("/api/study-sets", payload).then((r) => r.data),
  update: (id, changes) => api.patch(`/api/study-sets/${id}`, changes).then((r) => r.data),
  remove: (id) => api.delete(`/api/study-sets/${id}`).then((r) => r.data),

  // Practice sessions (learner)
  startSession: (id, mode) => api.post(`/api/study-sets/${id}/sessions`, { mode }).then((r) => r.data),
  listMySessions: () => api.get("/api/study-sets/sessions/mine").then((r) => r.data),
  submitAnswer: (sessionId, payload) =>
    api.post(`/api/study-sets/sessions/${sessionId}/answers`, payload).then((r) => r.data),
  completeSession: (sessionId, score) =>
    api.patch(`/api/study-sets/sessions/${sessionId}/complete`, { score }).then((r) => r.data),
  getSessionResults: (sessionId) =>
    api.get(`/api/study-sets/sessions/${sessionId}/results`).then((r) => r.data),
  listLearnerStudySets: () =>
    api.get("/api/study-sets/learner").then((r) => r.data),
};
