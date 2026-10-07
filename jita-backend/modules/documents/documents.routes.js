import express from 'express';
import { documentsController } from './documents.controller.js';
import { documentsService } from './documents.service.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/documents/mine', requireAuth, documentsController.getMine);
router.post(
  '/documents/upload',
  requireAuth,
  documentsService.uploadMiddleware.single('file'),
  documentsController.upload
);
router.delete('/documents/:id', requireAuth, documentsController.deleteDocument);

// File downloads
router.get('/documents/file/:id', requireAuth, documentsController.serveFile);
router.get('/documents/:id/file', requireAuth, documentsController.serveFile);

export default router;
