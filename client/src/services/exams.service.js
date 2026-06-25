import axiosClient from "./axiosClient";
import { getCookie } from "../lib/utils";

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
}

function authHeaders() {
  const token = getCookie("access_token");
  return token ? { Authorization: `Bearer ${decodeURIComponent(token)}` } : {};
}

export const examsService = {
  listMine: (params) => axiosClient.get("/api/exams", { params }).then((r) => r.data),
  listAvailable: (params) => axiosClient.get("/api/exams/learner", { params }).then((r) => r.data),
  listForClass: (classId) => axiosClient.get(`/api/exams/class/${classId}`).then((r) => r.data),
  getOne: (id) => axiosClient.get(`/api/exams/${id}`).then((r) => r.data.data),
  getLearnerExam: (id) => axiosClient.get(`/api/exams/learner/${id}`).then((r) => r.data.data),
  create: (payload) => axiosClient.post("/api/exams", payload).then((r) => r.data),
  updateSettings: (id, changes) =>
    axiosClient.patch(`/api/exams/${id}/settings`, changes).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/api/exams/${id}`).then((r) => r.data),
  listAttempts: (id) => axiosClient.get(`/api/exams/${id}/attempts`).then((r) => r.data),

  // Learner: take exams
  startAttempt: (id, payload) => axiosClient.post(`/api/exams/${id}/attempts`, payload).then((r) => r.data.data),
  getAttempt: (attemptId) => axiosClient.get(`/api/exams/attempts/${attemptId}`).then((r) => r.data.data),
  listMyAttempts: () => axiosClient.get("/api/exams/attempts/mine").then((r) => r.data),
  submitAnswer: (attemptId, payload) =>
    axiosClient.post(`/api/exams/attempts/${attemptId}/answers`, payload).then((r) => r.data.data),
  submitAttempt: (attemptId, payload) =>
    axiosClient.patch(`/api/exams/attempts/${attemptId}/submit`, payload).then((r) => r.data.data),
  recordAttemptEvent: (attemptId, payload) =>
    axiosClient.post(`/api/exams/attempts/${attemptId}/events`, payload).then((r) => r.data.data),
  recordAttemptEventKeepAlive: (attemptId, payload) => {
    if (typeof window === "undefined") return Promise.resolve();

    return fetch(`${apiBaseUrl()}/api/exams/attempts/${attemptId}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  },
  getAttemptResults: (attemptId) =>
    axiosClient.get(`/api/exams/attempts/${attemptId}/results`).then((r) => r.data.data),
};
