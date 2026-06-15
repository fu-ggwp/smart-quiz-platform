import api from "./api";

export const questionBanksService = {
  listMine: (params) => api.get("/api/question-banks", { params }).then((r) => r.data.data),
  getOne: (id) => api.get(`/api/question-banks/${id}`).then((r) => r.data),
  create: (payload) => api.post("/api/question-banks", payload).then((r) => r.data),
  update: (id, changes) => api.patch(`/api/question-banks/${id}`, changes).then((r) => r.data),
  remove: (id) => api.delete(`/api/question-banks/${id}`).then((r) => r.data),
};