import tokenManager from "@/lib/tokenManager";
import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000/",
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;

      console.error("❌ API Error Response:", {
        status,
        url: error.config?.url,
        data,
      });

      switch (status) {
        case 401:
          tokenManager.clearAuth();
          window.location.href = "/login";
          break;
        case 403:
          console.error("Access forbidden");
          break;
        case 404:
          console.error("Resource not found");
          break;
        case 500:
          console.error("Server error");
          break;
        default:
          console.error(`HTTP ${status} error`);
      }
    } else if (error.request) {
      console.error("❌ Network Error:", error.request);
    } else {
      console.error("❌ Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;

export const apiClient = {
  get: (url: string, config?: AxiosRequestConfig) => api.get(url, config),
  post: (url: string, data?: any, config?: AxiosRequestConfig) =>
    api.post(url, data, config),
  put: (url: string, data?: any, config?: AxiosRequestConfig) =>
    api.put(url, data, config),
  patch: (url: string, data?: any, config?: AxiosRequestConfig) =>
    api.patch(url, data, config),
  delete: (url: string, config?: AxiosRequestConfig) => api.delete(url, config),
};
