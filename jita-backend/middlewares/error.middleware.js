import { logger } from '../shared/logger.js';

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR');
  const message = err.message || 'Terjadi kesalahan pada server';
  const details = err.details || [];

  if (statusCode >= 500) {
    logger.error({ err, req: { method: req.method, url: req.url } }, message);
  } else {
    logger.warn({ statusCode, code, message, path: req.url });
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details.length > 0 ? { details } : {}),
    },
  });
}

export function notFoundHandler(req, res, _next) {
  return res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Rute ${req.method} ${req.originalUrl} tidak ditemukan`,
    },
  });
}

export default { errorHandler, notFoundHandler };
