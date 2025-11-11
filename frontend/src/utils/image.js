const RELATIVE_UPLOAD_PREFIXES = ['/api/uploads/', '/uploads/'];

export function isRenderableImage(src) {
  if (typeof src !== 'string') return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return true;
  }
  return RELATIVE_UPLOAD_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}
