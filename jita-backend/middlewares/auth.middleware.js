import { AuthenticationError, AuthorizationError } from '../errors/AppError.js';

export const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    throw new AuthenticationError('Unauthorized. Silakan login terlebih dahulu.');
  }
  next();
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      throw new AuthenticationError('Unauthorized.');
    }
    if (!roles.includes(req.session.user.role)) {
      throw new AuthorizationError('Akses ditolak.');
    }
    next();
  };
};

export default { requireAuth, requireRole };
