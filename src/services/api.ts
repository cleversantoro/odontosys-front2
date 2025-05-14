//import axios from "axios";

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

//Interceptor de request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// // Função utilitária para logout
const handleLogout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "/Login"; // ou "/logout"
};

// Interceptor de response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const res = await axios.post(`${import.meta.env.REACT_APP_API_URL}/auth/refresh`, { refreshToken });
          const { accessToken } = res.data;

          localStorage.setItem("accessToken", accessToken);
          api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

          return api(originalRequest);
        } catch (err) {
          console.error("Erro ao renovar o token:", err);
          handleLogout();
        }
      } else {
        handleLogout();
      }
    }

     return Promise.reject(error);
   }
 );

export default api;
