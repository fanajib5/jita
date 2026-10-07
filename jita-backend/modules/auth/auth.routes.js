import express from 'express';
import { authController } from './auth.controller.js';

const router = express.Router();

// Endpoint SSO Login: /api/sso/login
router.get('/sso/login', authController.ssoLogin);

// Endpoint Auth Lokal
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authController.me);
router.post('/auth/logout', authController.logout);

export default router;
