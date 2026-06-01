import axios from 'axios';
import { dispatchSuspended } from '@/components/SuspendedModal';

const rawBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
const normalized = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : undefined;
const baseURL = normalized ? (normalized.endsWith('/api') ? normalized : `${normalized}/api`) : '/api';

const api = axios.create({
  baseURL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor to kick out suspended users instantly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg = error.response?.data?.error || '';
    const hadToken = !!localStorage.getItem('auth_token');
    if (error.response?.status === 403 && errorMsg.includes('ระงับ') && hadToken) {
      dispatchSuspended(); // dispatchSuspended() itself removes the token and has a one-shot guard
    }
    return Promise.reject(error);
  }
);

export default api;
