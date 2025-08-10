import axios from "axios";
import Cookies from "js-cookie";

const axiosInstance = (
  requireToken = false,
  contentType = "application/json"
) => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      "Content-Type": contentType,
    },
  });
  console.log(
    "Axios instance created with base URL:",
    process.env.NEXT_PUBLIC_API_URL
  );

  if (requireToken) {
    instance.interceptors.request.use((config) => {
      const token = Cookies.get("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  return instance;
};

export default axiosInstance;
