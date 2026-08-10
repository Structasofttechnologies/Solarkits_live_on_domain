/**
 * axiosInstance.js
 *
 * A pre-configured Axios instance that automatically handles:
 *  - Cookie-based auth (withCredentials: true)
 *  - Silent access-token refresh on 401 responses
 *  - Retry of the original failed request after a successful refresh
 *
 * NOTE: We intentionally do NOT redirect to /auth/login here.
 * Redirecting from the interceptor causes an infinite reload loop when
 * the user is on the login page (checkAuth → 401 → refresh fails → redirect
 * → reload → checkAuth → 401 → ...). Instead we just clear stale session
 * data and reject the error; the Redux auth slice sets isAuthenticated=false
 * and the app route guards handle showing the login UI.
 */

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // always send cookies
});

// Track whether a token refresh is already in flight so concurrent 401s
// don't all trigger their own refresh requests.
let isRefreshing = false;
let failedQueue = []; // [{ resolve, reject }]

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// ─── Response Interceptor ───────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  // Pass through successful responses unchanged
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Skip retry logic for:
    //  - Non-401 errors
    //  - Requests that have already been retried (_retry flag)
    //  - Auth endpoints (avoid infinite loops): refresh-token, login, me
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/refresh-token") ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/me");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        // Another refresh is already in flight — queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to get a new access_token using the refresh_token cookie
        await axios.post(
          `${API_BASE}/india/v1/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        // Refresh succeeded — flush the queue and retry the original request
        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh also failed — clear stale session data and reject.
        // Do NOT use window.location.href here — that causes an infinite
        // reload loop when the user is already on /auth/login.
        processQueue(refreshError);
        try {
          sessionStorage.removeItem("user");
        } catch (_) {}

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
