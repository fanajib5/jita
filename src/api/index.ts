import axios from 'axios';

export const API_BASE =
  import.meta.env?.VITE_API_BASE !== undefined
    ? import.meta.env.VITE_API_BASE
    : import.meta.env?.DEV
      ? 'http://localhost:3000'
      : '';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: tangani sesi habis / 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Abaikan jika error 401 berasal dari auth probe atau login/register
      const url = error.config?.url || '';
      const isProbeOrAuth =
        url.includes('/api/auth/login') ||
        url.includes('/api/auth/register') ||
        url.includes('/api/auth/me') ||
        url.includes('/api/users/me');

      if (!isProbeOrAuth) {
        // Hapus penanda sesi lokal jika ada dan arahkan ke login dengan query expired
        const loginPath = `${import.meta.env.BASE_URL}login?session_expired=1`;
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = loginPath;
        }
      }
    }
    return Promise.reject(error);
  }
);
