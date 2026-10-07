import { eventsService } from './events.service.js';

export const eventsController = {
  async getEvents(req, res, next) {
    try {
      const { from, to, type } = req.query;
      const events = await eventsService.getEvents({ from, to, type });
      return res.json({ events });
    } catch (err) {
      next(err);
    }
  },

  async createEvent(req, res, next) {
    try {
      const event = await eventsService.createEvent(req.body, req.session.user.id);
      return res.status(201).json({ event });
    } catch (err) {
      next(err);
    }
  },

  async deleteEvent(req, res, next) {
    try {
      const { id } = req.params;
      await eventsService.deleteEvent(id, req.session.user.id);
      return res.json({ success: true, message: 'Event berhasil dihapus' });
    } catch (err) {
      next(err);
    }
  },
};

export default eventsController;
