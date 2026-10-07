import express from 'express';
import { notificationsController } from './notifications.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/notifications/mine', requireAuth, notificationsController.getMine);
router.post('/notifications/:id/read', requireAuth, notificationsController.markRead);

export default router;
