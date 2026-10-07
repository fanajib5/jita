import { usersService } from './users.service.js';

export const usersController = {
  async getMe(req, res, next) {
    try {
      const user = await usersService.getCurrentUser(req.session.user.id);
      return res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req, res, next) {
    try {
      const updatedUser = await usersService.updateCurrentUser(req.session.user.id, req.body);
      return res.json({ user: updatedUser });
    } catch (err) {
      next(err);
    }
  },
};

export default usersController;
