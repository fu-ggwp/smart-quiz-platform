import axiosClient from "./axiosClient";

export const analyticsService = {
  listReports: () => axiosClient.get("/api/analytics/reports").then((r) => r.data),
  getReport: (id) => axiosClient.get(`/api/analytics/reports/${id}`).then((r) => r.data),
  generateClassReport: (classId) =>
    axiosClient.post(`/api/analytics/classes/${classId}/report`).then((r) => r.data),
  generateLearnerReport: () => axiosClient.post("/api/analytics/progress").then((r) => r.data),
};
