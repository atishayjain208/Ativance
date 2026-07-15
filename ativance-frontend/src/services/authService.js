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

// ── Auth ──────────────────────────────────────────────────────────────────────

/** signup({ name, email, password }) → { token, user } */
export const signup = async ({ name, email, password }) => {
  const { data } = await API.post('/api/auth/signup', { name, email, password });
  return data;
};

/** login({ email, password }) → { token, user } */
export const login = async ({ email, password }) => {
  const { data } = await API.post('/api/auth/login', { email, password });
  return data;
};

// ── User profile ──────────────────────────────────────────────────────────────

/** Fetch the logged-in user's full profile */
export const getProfile = async () => {
  const { data } = await API.get('/api/user/profile');
  return data; // { success, user }
};

/** Update editable profile fields */
export const updateProfile = async (fields) => {
  const { data } = await API.put('/api/user/profile', fields);
  return data; // { success, message, user }
};

// ── Resume ────────────────────────────────────────────────────────────────────

/**
 * Upload a PDF resume file.
 * @param {File} file  The PDF File object from the input element.
 * @param {function} onProgress  Optional (loaded, total) callback for progress.
 */
export const uploadResume = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('resume', file);

  const { data } = await API.post('/api/resume/upload', formData, {
    // Let the browser set Content-Type + boundary automatically
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => onProgress(e.loaded, e.total)
      : undefined,
  });
  return data; // { success, message, warning?, resume, textExtracted }
};

/** Trigger AI analysis of the stored resume text */
export const analyzeResume = async () => {
  const { data } = await API.post('/api/resume/analyze');
  return data; // { success, message, resumeAnalysis }
};

// ── GitHub ────────────────────────────────────────────────────────────────────

/**
 * Analyze a GitHub user's public profile and repos.
 * @param {string} username  GitHub username
 */
export const analyzeGithub = async (username) => {
  const { data } = await API.get(`/api/github/analyze/${encodeURIComponent(username)}`);
  return data; // { success, githubStats, warning? }
};
