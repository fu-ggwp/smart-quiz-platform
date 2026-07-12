import axiosClient from "./axios-client";

// Role-specific dashboard endpoints return card-ready payloads for each dashboard page.
export const dashboardsService = {
  getLearnerDashboard: () => axiosClient.get("/api/dashboards/learner").then((r) => r.data.data),
  getTeacherDashboard: () => axiosClient.get("/api/dashboards/teacher").then((r) => r.data.data),
};
