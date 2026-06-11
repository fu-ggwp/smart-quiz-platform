import api from "./api";

const classesService = {
  // Teacher: fetch all own classes (backend returns { ok, data: [...] })
  listMine: () => api.get("/api/classes").then((r) => r.data.data),
  getOne: (id) => api.get(`/api/classes/${id}`).then((r) => r.data.data),
  create: (payload) => api.post("/api/classes", payload).then((r) => r.data.data),
  update: (id, changes) => api.patch(`/api/classes/${id}`, changes).then((r) => r.data.data),
  remove: (id) => api.delete(`/api/classes/${id}`).then((r) => r.data),
  listMembers: (id) => api.get(`/api/classes/${id}/members`).then((r) => r.data.data),
  listJoinRequests: (id) => api.get(`/api/classes/${id}/join-requests`).then((r) => r.data.data),

  // Learner: join a class
  join: (id) => api.post(`/api/classes/${id}/join`).then((r) => r.data),
  resolveJoinRequest: (requestId, status) =>
    api.patch(`/api/classes/join-requests/${requestId}`, { status }).then((r) => r.data),
};

export default classesService;
