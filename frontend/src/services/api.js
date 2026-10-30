import axios from 'axios';

/** Central API service — the only place that knows backend URLs. */
const TOKEN_KEY = 'mt_token';
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 180000 });

http.interceptors.request.use((config) => {
  const t = tokenStore.get();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

http.interceptors.response.use(
  (res) => res.data.data,
  (err) => {
    const status = err.response?.status;
    const message =
      err.response?.data?.error?.message ||
      (err.code === 'ECONNABORTED' ? 'The request timed out.' : !err.response ? 'Cannot reach the server. Is the backend running?' : 'Something went wrong.');
    if (status === 401 && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new Event('mt:logout'));
    }
    return Promise.reject({ status, message, details: err.response?.data?.error?.details });
  }
);

export const api = {
  health: () => http.get('/health'),
  auth: {
    register: (body) => http.post('/auth/register', body),
    login: (body) => http.post('/auth/login', body),
    me: () => http.get('/auth/me'),
  },
  analysis: {
    create: (formData, onUploadProgress) => http.post('/analysis', formData, { onUploadProgress }),
    list: (params) => http.get('/analysis', { params }),
    get: (id) => http.get(`/analysis/${id}`),
    remove: (id) => http.delete(`/analysis/${id}`),
  },
  materials: {
    list: (params) => http.get('/materials', { params }),
    get: (id) => http.get(`/materials/${id}`),
  },
  dashboard: { stats: () => http.get('/dashboard/stats') },
  translate: {
    languages: () => http.get('/translate/languages'),
    translate: (targetLang, texts) => http.post('/translate', { targetLang, texts }),
  },
};
