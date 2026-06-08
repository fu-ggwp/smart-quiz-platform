import api from "@/services/api";

export async function registerAccount(payload) {
  const { data } = await api.post("/api/auth/register", payload);
  return data;
}

export async function loginAccount(payload) {
  const { data } = await api.post("/api/auth/login", payload);
  return data;
}
