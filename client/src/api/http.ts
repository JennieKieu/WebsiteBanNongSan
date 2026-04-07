import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const refreshRes = await axios.post(`${http.defaults.baseURL}/auth/refresh-token`, { refreshToken });
          const { accessToken, refreshToken: nextRefresh } = refreshRes.data.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", nextRefresh);
          original.headers.Authorization = `Bearer ${accessToken}`;
          return http(original);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default http;
