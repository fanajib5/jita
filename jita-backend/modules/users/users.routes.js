import express from 'express';
import { usersController } from './users.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/users/me', requireAuth, usersController.getMe);
router.put('/users/me', requireAuth, usersController.updateMe);

export default router;
