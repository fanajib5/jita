import { learningService } from './learning.service.js';

export const learningController = {
  async getAllCourses(req, res, next) {
    try {
      const courses = await learningService.getAllCourses();
      return res.json({ courses });
    } catch (err) {
      next(err);
    }
  },

  async getUserProgress(req, res, next) {
    try {
      const progress = await learningService.getUserProgress(req.session.user.id);
      return res.json({ progress });
    } catch (err) {
      next(err);
    }
  },

  async getCourseById(req, res, next) {
    try {
      const course = await learningService.getCourseById(Number(req.params.id));
      return res.json({ course });
    } catch (err) {
      next(err);
    }
  },

  async createCourse(req, res, next) {
    try {
      const course = await learningService.createCourse(req.body, req.session.user.id);
      return res.status(201).json({ course });
    } catch (err) {
      next(err);
    }
  },

  async updateCourse(req, res, next) {
    try {
      const course = await learningService.updateCourse(
        Number(req.params.id),
        req.body,
        req.session.user
      );
      return res.json({ course });
    } catch (err) {
      next(err);
    }
  },

  async deleteCourse(req, res, next) {
    try {
      await learningService.deleteCourse(Number(req.params.id), req.session.user.id);
      return res.json({ success: true, message: 'Kursus berhasil dihapus.' });
    } catch (err) {
      next(err);
    }
  },

  async getCourseModules(req, res, next) {
    try {
      const modules = await learningService.getCourseModules(Number(req.params.id));
      return res.json({ modules });
    } catch (err) {
      next(err);
    }
  },

  async addCourseModule(req, res, next) {
    try {
      const moduleRow = await learningService.addCourseModule(
        Number(req.params.id),
        req.body,
        req.session.user
      );
      return res.status(201).json({ module: moduleRow });
    } catch (err) {
      next(err);
    }
  },

  async updateCourseModule(req, res, next) {
    try {
      const moduleRow = await learningService.updateCourseModule(
        Number(req.params.id),
        Number(req.params.moduleId),
        req.body,
        req.session.user
      );
      return res.json({ module: moduleRow });
    } catch (err) {
      next(err);
    }
  },

  async deleteCourseModule(req, res, next) {
    try {
      await learningService.deleteCourseModule(
        Number(req.params.id),
        Number(req.params.moduleId),
        req.session.user
      );
      return res.json({ success: true, message: 'Modul berhasil dihapus.' });
    } catch (err) {
      next(err);
    }
  },

  async enrollCourse(req, res, next) {
    try {
      await learningService.enrollCourse(Number(req.params.id), req.session.user.id);
      return res.json({ message: 'Berhasil mendaftar kursus' });
    } catch (err) {
      next(err);
    }
  },

  async updateProgress(req, res, next) {
    try {
      const result = await learningService.updateProgress(
        Number(req.params.id),
        req.session.user.id,
        req.body.progress_pct
      );
      return res.json({
        message: 'Progress kursus berhasil diperbarui',
        progress_pct: result.pct,
        status: result.status,
      });
    } catch (err) {
      next(err);
    }
  },
};

export default learningController;
