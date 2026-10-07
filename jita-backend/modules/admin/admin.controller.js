import { adminService } from './admin.service.js';
import { ValidationError } from '../../errors/AppError.js';

export const adminController = {
  async getPendingDocuments(req, res, next) {
    try {
      const documents = await adminService.getPendingDocuments();
      res.json({ documents });
    } catch (err) {
      next(err);
    }
  },

  async decideDocument(req, res, next) {
    try {
      const id = Number(req.params.id);
      const { action, notes } = req.body;
      const result = await adminService.decideDocument(id, req.session.user.id, action, notes);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async batchDecideDocuments(req, res, next) {
    try {
      const { ids, action } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ValidationError('IDs wajib berupa array non-kosong');
      }
      const result = await adminService.batchDecideDocuments(ids, req.session.user.id, action);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const stats = await adminService.getAdminStats();
      res.json({ stats });
    } catch (err) {
      next(err);
    }
  },
};

export default adminController;
