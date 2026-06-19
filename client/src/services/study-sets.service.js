import axiosClient from "./axiosClient";

export const studySetsService = {
  listMine: (params) => axiosClient.get("/api/study-sets/mine", { params }).then((r) => r.data),
  listPublic: () =>
    axiosClient.get("/api/study-sets/public").then((r) => r.data),
  listAvailable: (params) => axiosClient.get("/api/study-sets", { params }).then((r) => r.data),
  getOne: (id) => axiosClient.get(`/api/study-sets/${id}`).then((r) => r.data),
  create: (payload) => axiosClient.post("/api/study-sets", payload).then((r) => r.data),
  update: (id, changes) => axiosClient.patch(`/api/study-sets/${id}`, changes).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/api/study-sets/${id}`).then((r) => r.data),

  // Practice sessions (learner)
  startSession: (id, mode) => axiosClient.post(`/api/study-sets/${id}/sessions`, { mode }).then((r) => r.data),
  listMySessions: () => axiosClient.get("/api/study-sets/sessions/mine").then((r) => r.data),
  submitAnswer: (sessionId, payload) =>
    axiosClient.post(`/api/study-sets/sessions/${sessionId}/answers`, payload).then((r) => r.data),
  completeSession: (sessionId, score) =>
    axiosClient.patch(`/api/study-sets/sessions/${sessionId}/complete`, { score }).then((r) => r.data),
  getSessionResults: (sessionId) =>
    axiosClient.get(`/api/study-sets/sessions/${sessionId}/results`).then((r) => r.data),
  listLearnerStudySets: () =>
    axiosClient.get("/api/study-sets/learner").then((r) => r.data),
};
