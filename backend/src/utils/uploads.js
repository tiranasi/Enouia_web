const UPLOAD_PREFIX = '/uploads/';
const API_UPLOAD_PREFIX = '/api/uploads/';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function isLikelyLocalHost(hostname = '') {
  const lower = hostname.toLowerCase();
  if (LOCAL_HOSTS.has(lower)) return true;
  if (lower.startsWith('127.')) return true;
  return false;
}

function ensureApiUploadsPath(pathname = '') {
  if (!pathname) return null;
  if (pathname.startsWith(API_UPLOAD_PREFIX)) return pathname;
  if (pathname.startsWith(UPLOAD_PREFIX)) {
    return `${API_UPLOAD_PREFIX}${pathname.slice(UPLOAD_PREFIX.length)}`;
  }
  return null;
}

export function normalizeUploadUrl(input) {
  if (!input || typeof input !== 'string') return input;
  const value = input.trim();
  if (!value) return value;
  if (value.startsWith(API_UPLOAD_PREFIX)) return value;
  if (value.startsWith(UPLOAD_PREFIX)) {
    return `${API_UPLOAD_PREFIX}${value.slice(UPLOAD_PREFIX.length)}`;
  }
  try {
    const url = new URL(value);
    if (!isLikelyLocalHost(url.hostname)) return value;
    const normalizedPath = ensureApiUploadsPath(url.pathname);
    if (normalizedPath) return normalizedPath;
  } catch {
    // Not an absolute URL; ignore
  }
  return value;
}

export function normalizeSharedStyleData(data) {
  if (!data || typeof data !== 'object') return data;
  if (typeof data.avatar !== 'string') return data;
  const normalizedAvatar = normalizeUploadUrl(data.avatar);
  if (normalizedAvatar === data.avatar) return data;
  return { ...data, avatar: normalizedAvatar };
}
