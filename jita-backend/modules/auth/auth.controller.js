import { authService } from './auth.service.js';

export const authController = {
  async ssoLogin(req, res, next) {
    const { token } = req.query;
    try {
      const user = await authService.handleIceSsoLogin(token);
      req.session.user = user;
      return res.redirect('/jita/student');
    } catch (err) {
      next(err);
    }
  },

  async register(req, res, next) {
    try {
      const { name, email, password, iceUuid } = req.body;
      const user = await authService.registerUser({ name, email, password, iceUuid });
      req.session.user = user;
      return res.status(201).json({
        success: true,
        message: 'Registrasi berhasil',
        user: req.session.user,
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await authService.loginLocal({ email, password });
      req.session.user = user;
      return res.json({
        success: true,
        message: 'Login berhasil',
        user: req.session.user,
      });
    } catch (err) {
      next(err);
    }
  },

  me(req, res, _next) {
    if (req.session && req.session.user) {
      return res.json({ user: req.session.user });
    }
    return res.status(401).json({
      success: false,
      error: { message: 'Tidak ada sesi aktif.' },
    });
  },

  logout(req, res, next) {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('connect.sid');
      return res.json({ message: 'Logout berhasil' });
    });
  },
};

export default authController;
