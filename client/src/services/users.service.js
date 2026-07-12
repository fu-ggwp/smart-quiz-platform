import axiosClient from "./axios-client";

export const usersService = {
  listPublic: (params) =>
    axiosClient.get("/api/users/public", { params }).then((r) => r.data),
  getPublicProfile: (username) =>
    axiosClient.get(`/api/users/public/${encodeURIComponent(username)}`).then((r) => r.data),

  listForAdmin: (params) => axiosClient.get("/api/users", { params }).then((r) => r.data.data),
  getForAdmin: (id) => axiosClient.get(`/api/users/${id}`).then((r) => r.data.data),
  updateStatus: (id, payload) => axiosClient.patch(`/api/users/${id}/status`, payload).then((r) => r.data.data),
};
