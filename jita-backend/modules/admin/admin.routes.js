import express from 'express';
import adminController from './admin.controller.js';
import { requireRole } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/admin/pending-documents', requireRole('admin'), adminController.getPendingDocuments);
router.get('/admin/documents/pending', requireRole('admin'), adminController.getPendingDocuments);
router.post('/admin/documents/:id/decide', requireRole('admin'), adminController.decideDocument);
router.post('/admin/documents/batch-decide', requireRole('admin'), adminController.batchDecideDocuments);
router.get('/admin/stats', requireRole('admin'), adminController.getStats);

export default router;
