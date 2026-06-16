import axios from "axios";
import supabase from "../lib/supabaseClient";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",
});

// Attach the current Supabase session's access token so the backend's
// `requireAuth` middleware can verify the request.
axiosClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
