import axiosClient from "./axios-client";

// Role-specific home page endpoints return card-ready payloads for each home page.
export const homeService = {
  getLearnerHome: () => axiosClient.get("/api/home/learner").then((r) => r.data.data),
  getTeacherHome: () => axiosClient.get("/api/home/teacher").then((r) => r.data.data),
};
