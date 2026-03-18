import axios from "axios";

const api = axios.create({
  baseURL:"http://localhost:3000/api",
  withCredentials: true, // important for refresh cookies
});
//  Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

//  Handle 401 & Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("login-user") &&
      !originalRequest.url.includes("create-user") &&
      !originalRequest.url.includes("refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        const storedRefreshToken = localStorage.getItem("refreshToken");
        if (!storedRefreshToken) {
          throw new Error("No refresh token available");
        }

        const res = await api.post("/users/refresh-token", {
          refreshToken: storedRefreshToken,
        });

        const newAccessToken = res.data?.data?.accessToken;
        if (!newAccessToken) {
          throw new Error("Refresh endpoint did not return access token");
        }

        localStorage.setItem("token", newAccessToken);

        originalRequest.headers.Authorization = "Bearer " + newAccessToken;

        return api(originalRequest);
      } catch (refreshError) {
        //  Refresh failed → logout
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");

        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
