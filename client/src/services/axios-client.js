import axios from "axios";
import { getCookie } from "../lib/utils";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",
});

// add access token to requests for backend `requireAuth` 
axiosClient.interceptors.request.use((config) => {
  const cookieToken = getCookie("access_token");

  if (cookieToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${decodeURIComponent(cookieToken)}`;
  }

  return config;
});

export default axiosClient;
