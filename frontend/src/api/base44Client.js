const API_BASE = '/api';

function qs(params = {}) {
  // 过滤 undefined/null/空字符串，避免出现 ?order=undefined&limit=undefined
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  );
  const s = new URLSearchParams(filtered);
  const q = s.toString();
  return q ? `?${q}` : '';
}

function authHeader() {
  try {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function http(method, url, body) {
  const headers = { 'Content-Type': 'application/json', ...authHeader() };
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

  function entityClient(entity) {
    return {
      async list(order, limit) {
      return http('GET', `${API_BASE}/entities/${entity}${qs({ order, limit })}`);
      },
      async get(id) {
        return http('GET', `${API_BASE}/entities/${entity}/${id}`);
      },
      async create(data) {
        return http('POST', `${API_BASE}/entities/${entity}`, data);
      },
      async update(id, data) {
      return http('PUT', `${API_BASE}/entities/${entity}/${id}`, data);
    },
    async delete(id) {
      return http('DELETE', `${API_BASE}/entities/${entity}/${id}`);
    },
  };
}

export const base44 = {
  auth: {
    async register({ email, password }) {
      return http('POST', `${API_BASE}/auth/register`, { email, password });
    },
    async login({ email, password }) {
      const data = await http('POST', `${API_BASE}/auth/login`, { email, password });
      try { localStorage.setItem('token', data.token); } catch {}
      return data;
    },
    async me() {
      return http('GET', `${API_BASE}/me`);
    },
    async updateMe(data) {
      return http('PUT', `${API_BASE}/me`, data);
    },
  },
  users: {
    async getByEmail(email) {
      return http('GET', `${API_BASE}/users/by-email/${encodeURIComponent(email)}`);
    },
  },
  entities: {
    Post: entityClient('Post'),
    Comment: entityClient('Comment'),
    Notification: entityClient('Notification'),
    Favorite: entityClient('Favorite'),
    ChatHistory: entityClient('ChatHistory'),
    ChatStyle: entityClient('ChatStyle'),
    EmotionReport: entityClient('EmotionReport'),
    TrendAnalysis: entityClient('TrendAnalysis'),
    Course: entityClient('Course'),
  },
  integrations: {
    Core: {
      async InvokeLLM(payload) {
        return http('POST', `${API_BASE}/integrations/core/invokeLLM`, payload);
      },
      async UploadFile({ file }) {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`${API_BASE}/integrations/core/uploadFile`, {
          method: 'POST',
          headers: { ...authHeader() },
          body: form,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        return res.json();
      },
    },
  },
};
