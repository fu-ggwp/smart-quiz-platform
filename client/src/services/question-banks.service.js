import axiosClient from "./axios-client";
import { aiService } from "./ai.service";

// Teacher question-bank API wrapper. Each method returns the backend `data` payload.
export const questionBanksService = {
  // List/detail endpoints for teacher-owned banks.
  listMine: (params) => axiosClient.get("/api/question-banks", { params }).then((r) => r.data.data),
  listReady: () => axiosClient.get("/api/question-banks/ready").then((r) => r.data.data),
  getOne: (id) => axiosClient.get(`/api/question-banks/${id}`).then((r) => r.data.data),
  // Question endpoints keep editable bank questions separate from bank metadata.
  listQuestions: (id) => axiosClient.get(`/api/question-banks/${id}/questions`).then((r) => r.data.data),
  listReadyQuestions: (id) => axiosClient.get(`/api/question-banks/ready/${id}/questions`).then((r) => r.data.data),
  // Mutations send the editor payload shape built in _lib/question-bank-editor.js.
  create: (payload) => axiosClient.post("/api/question-banks", payload).then((r) => r.data.data),
  generateFromMaterial: aiService.generateQuestionsFromMaterial,
  update: (id, changes) => axiosClient.patch(`/api/question-banks/${id}`, changes).then((r) => r.data.data),
  remove: (id) => axiosClient.delete(`/api/question-banks/${id}`).then((r) => r.data.data),
};
