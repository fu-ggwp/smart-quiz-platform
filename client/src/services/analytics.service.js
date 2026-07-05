import axiosClient from "./axiosClient";

export const analyticsService = {
  getOverview: () => axiosClient.get("/api/analytics/learner-progress").then((r) => r.data.data),
};
