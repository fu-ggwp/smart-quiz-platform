import axiosClient from "./axiosClient";

export const questionBanksService = {
  listMine: (params) => axiosClient.get("/api/question-banks", { params }).then((r) => r.data.data),
  listAssigned: () => axiosClient.get("/api/question-banks/assigned").then((r) => r.data.data),
  getOne: (id) => axiosClient.get(`/api/question-banks/${id}`).then((r) => r.data),
  listQuestions: (id) => axiosClient.get(`/api/question-banks/${id}/questions`).then((r) => r.data.data),
  listAssignedQuestions: (id) => axiosClient.get(`/api/question-banks/assigned/${id}/questions`).then((r) => r.data.data),
  create: (payload) => axiosClient.post("/api/question-banks", payload).then((r) => r.data),
  generateFromMaterial: (payload) => axiosClient.post("/api/question-banks/generate-from-material", payload).then((r) => r.data.data),
  update: (id, changes) => axiosClient.patch(`/api/question-banks/${id}`, changes).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/api/question-banks/${id}`).then((r) => r.data),
};
