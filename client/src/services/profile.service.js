import axiosClient from "./axiosClient";

export const profileService = {
  getMine: () => axiosClient.get("/api/auth/me").then((r) => r.data),
  updateMine: (changes) => axiosClient.patch("/api/profiles/me", changes).then((r) => r.data),
  getByUsername: (username) => axiosClient.get(`/api/profiles/${username}`).then((r) => r.data),
};
