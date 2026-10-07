import express from 'express';
import { postsController } from './posts.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/posts', postsController.getPosts);
router.get('/posts/:slugOrId', postsController.getPost);

router.post('/posts', requireAuth, requireRole('admin'), postsController.createPost);
router.put('/posts/:id', requireAuth, requireRole('admin'), postsController.updatePost);
router.delete('/posts/:id', requireAuth, requireRole('admin'), postsController.deletePost);

export default router;
