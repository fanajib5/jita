import { notificationsService } from './notifications.service.js';

export const notificationsController = {
  async getMine(req, res, next) {
    try {
      const data = await notificationsService.getMyNotifications(req.session.user.id);
      return res.json(data);
    } catch (err) {
      next(err);
    }
  },

  async markRead(req, res, next) {
    try {
      const { id } = req.params;
      await notificationsService.markAsRead(id, req.session.user.id);
      return res.json({ message: 'Ditandai sudah dibaca' });
    } catch (err) {
      next(err);
    }
  },
};

export default notificationsController;
