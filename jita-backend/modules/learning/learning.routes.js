import express from 'express';
import { learningController } from './learning.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/courses', learningController.getAllCourses);
router.get('/courses/progress/mine', requireAuth, learningController.getUserProgress);
router.get('/courses/me/progress', requireAuth, learningController.getUserProgress);
router.get('/courses/:id', learningController.getCourseById);
router.post('/courses', requireRole('admin'), learningController.createCourse);
router.put('/courses/:id', requireAuth, learningController.updateCourse);
router.delete('/courses/:id', requireRole('admin'), learningController.deleteCourse);

// Modules
router.get('/courses/:id/modules', learningController.getCourseModules);
router.post('/courses/:id/modules', requireAuth, learningController.addCourseModule);
router.put('/courses/:id/modules/:moduleId', requireAuth, learningController.updateCourseModule);
router.delete('/courses/:id/modules/:moduleId', requireAuth, learningController.deleteCourseModule);

// Enroll & Progress
router.post('/courses/:id/enroll', requireAuth, learningController.enrollCourse);
router.put('/courses/:id/progress', requireAuth, learningController.updateProgress);

export default router;
