import axiosClient from "./axiosClient";

export const profileService = {
  getMine: () => axiosClient.get("/api/auth/me").then((r) => r.data.data),
  updateMine: (changes) => axiosClient.patch("/api/auth/me", changes).then((r) => r.data.data),
  switchRole: (role) => axiosClient.patch("/api/auth/role", { role }).then((r) => r.data.data),
  getByUsername: (username) => axiosClient.get(`/api/profiles/${username}`).then((r) => r.data),
};
