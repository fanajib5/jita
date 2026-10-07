import express from 'express';
import cvController from './cv.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get(['/cv/export', '/cv/generate'], requireAuth, cvController.exportMyCv);
router.get('/cv/export/:candidateId', requireAuth, cvController.exportCandidateCv);

export default router;
