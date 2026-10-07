import express from 'express';
import { eventsController } from './events.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/calendar', eventsController.getEvents);
router.get('/calendar/events', eventsController.getEvents);
router.post('/calendar/events', requireAuth, eventsController.createEvent);
router.delete('/calendar/events/:id', requireAuth, eventsController.deleteEvent);

export default router;
