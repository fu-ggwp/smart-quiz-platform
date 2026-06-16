import axiosClient from "./axiosClient";

export const paymentsService = {
  listPlans: () => axiosClient.get("/api/payments/plans").then((r) => r.data),
  listMine: () => axiosClient.get("/api/payments").then((r) => r.data),
  getOne: (id) => axiosClient.get(`/api/payments/${id}`).then((r) => r.data),
  startCheckout: (planId) => axiosClient.post("/api/payments/checkout", { planId }).then((r) => r.data),
};
