import axiosClient from "./axiosClient";

const classesService = {
  // Teacher: fetch all own classes (backend returns { ok, data: [...] })
  listMine: () => axiosClient.get("/api/classes").then((r) => r.data.data),
  getOne: (id) => axiosClient.get(`/api/classes/${id}`).then((r) => r.data.data),
  create: (payload) => axiosClient.post("/api/classes", payload).then((r) => r.data.data),
  update: (id, changes) => axiosClient.patch(`/api/classes/${id}`, changes).then((r) => r.data.data),
  remove: (id) => axiosClient.delete(`/api/classes/${id}`).then((r) => r.data),
  listMembers: (id) => axiosClient.get(`/api/classes/${id}/members`).then((r) => r.data.data),
  listJoinRequests: (id) => axiosClient.get(`/api/classes/${id}/join-requests`).then((r) => r.data.data),
  removeMember: (classId, memberId) =>
    axiosClient.delete(`/api/classes/${classId}/members/${memberId}`).then((r) => r.data),

  // Learner: list joined classes
  listJoined: () => axiosClient.get("/api/classes/joined").then((r) => r.data.data),

  // Learner: join a class by code or invitation token
  joinClass: ({ classCode, invitationToken }) =>
    axiosClient.post("/api/classes/join", {
      ...(classCode ? { class_code: classCode } : {}),
      ...(invitationToken ? { invitation_token: invitationToken } : {}),
    }).then((r) => r.data.data),
  resolveJoinRequest: (requestId, status) =>
    axiosClient.patch(`/api/classes/join-requests/${requestId}`, { status }).then((r) => r.data),
};

export default classesService;
