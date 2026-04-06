import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: "http://localhost:5000/api", // Make sure this matches your backend port
  withCredentials: true, // <--- CRITICAL: This sends the HttpOnly Cookie to the backend
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor: on 401 Unauthorized, clear stale client-side auth data
// so the app doesn't keep rendering protected content with an invalid session.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't clear auth on aborted requests (expected during logout)
    if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // Only clear localStorage if we're NOT on the login/signup/logout routes
      // to avoid interfering with the normal login flow.
      const requestUrl = error.config?.url || "";
      const isAuthRoute =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/signup") ||
        requestUrl.includes("/auth/logout");

      if (!isAuthRoute) {
        console.warn("[API] 401 Unauthorized — clearing stale auth data");
        localStorage.removeItem("user");
        sessionStorage.clear();
      }
    }

    return Promise.reject(error);
  },
);

export default api;
