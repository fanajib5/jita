export function sanitizeDeletedFields(data) {
  if (!data || typeof data !== 'object') return data;
  if (data instanceof Date) return data.toISOString();
  if (Buffer.isBuffer(data)) return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeDeletedFields);
  }
  const clean = { ...data };
  delete clean.deleted_at;
  delete clean.deleted_by;
  for (const key of Object.keys(clean)) {
    if (clean[key] && typeof clean[key] === 'object') {
      clean[key] = sanitizeDeletedFields(clean[key]);
    }
  }
  return clean;
}

export function sanitizeMiddleware(req, res, next) {
  const originalJson = res.json;
  res.json = function (body) {
    return originalJson.call(this, sanitizeDeletedFields(body));
  };
  next();
}

export default sanitizeMiddleware;
