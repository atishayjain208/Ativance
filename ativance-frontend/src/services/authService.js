import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT to every request automatically if present ──────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * signup({ name, email, password })
 * Returns { token, user } on success.
 * Throws an error with a .message string on failure.
 */
export const signup = async ({ name, email, password }) => {
  const { data } = await API.post('/api/auth/signup', { name, email, password });
  return data; // { success, message, token, user }
};

/**
 * login({ email, password })
 * Returns { token, user } on success.
 * Throws an error with a .message string on failure.
 */
export const login = async ({ email, password }) => {
  const { data } = await API.post('/api/auth/login', { email, password });
  return data; // { success, message, token, user }
};
