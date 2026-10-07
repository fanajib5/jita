import { db } from '../../db.js';

export function buildCourseWithModules(courseRow, moduleRows) {
  return {
    ...courseRow,
    modules: (moduleRows || []).map((m) => ({
      id: m.id,
      title: m.title,
      title_jp: m.title_jp || null,
      sort_order: m.sort_order,
      duration_minutes: m.duration_minutes,
    })),
  };
}

export async function canManageCourse(courseId, user) {
  if (user.role === 'admin') return true;
  if (user.role !== 'educator_bilingual' && user.role !== 'educator_silver') return false;
  const [[course]] = await db.query(
    'SELECT educator_id FROM courses WHERE id = ? AND deleted_at IS NULL',
    [courseId]
  );
  return course && course.educator_id === user.id;
}

import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from '../../errors/AppError.js';

export const learningService = {
  buildCourseWithModules,
  canManageCourse,

  async getAllCourses() {
    const [courses] = await db.query(
      'SELECT * FROM courses WHERE is_active = 1 AND deleted_at IS NULL ORDER BY phase ASC, id ASC'
    );
    if (courses.length === 0) return [];

    const courseIds = courses.map((c) => c.id);
    const [modules] = await db.query(
      `SELECT * FROM course_modules WHERE course_id IN (?) AND deleted_at IS NULL ORDER BY course_id ASC, sort_order ASC`,
      [courseIds]
    );

    const modulesByCourse = {};
    for (const m of modules) {
      if (!modulesByCourse[m.course_id]) modulesByCourse[m.course_id] = [];
      modulesByCourse[m.course_id].push(m);
    }

    return courses.map((c) => buildCourseWithModules(c, modulesByCourse[c.id]));
  },

  async getUserProgress(userId) {
    const [rows] = await db.query(
      `SELECT ce.id, ce.course_id, c.title, c.phase, ce.progress_pct, ce.status, ce.started_at, ce.completed_at
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id
       WHERE ce.user_id = ?`,
      [userId]
    );
    return rows;
  },

  async getCourseById(courseId) {
    const [[course]] = await db.query(
      'SELECT * FROM courses WHERE id = ? AND deleted_at IS NULL',
      [courseId]
    );
    if (!course) {
      throw new NotFoundError('Kursus tidak ditemukan.');
    }

    const [modules] = await db.query(
      'SELECT * FROM course_modules WHERE course_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC',
      [courseId]
    );
    return buildCourseWithModules(course, modules);
  },

  async createCourse(data, userId) {
    const { title, title_jp, description, phase } = data;
    if (!title || !phase) {
      throw new ValidationError('title dan phase wajib diisi.');
    }
    const [result] = await db.query(
      'INSERT INTO courses (title, title_jp, description, phase, is_active, created_by) VALUES (?, ?, ?, ?, 1, ?)',
      [title, title_jp || null, description || null, Number(phase), userId]
    );
    const [[created]] = await db.query('SELECT * FROM courses WHERE id = ?', [result.insertId]);
    return buildCourseWithModules(created, []);
  },

  async updateCourse(courseId, data, user) {
    const [[course]] = await db.query(
      'SELECT * FROM courses WHERE id = ? AND deleted_at IS NULL',
      [courseId]
    );
    if (!course) {
      throw new NotFoundError('Kursus tidak ditemukan.');
    }

    const isAdmin = user.role === 'admin';
    const isOwnerEducator =
      (user.role === 'educator_bilingual' || user.role === 'educator_silver') &&
      course.educator_id === user.id;

    if (!isAdmin && !isOwnerEducator) {
      throw new AuthorizationError('Akses ditolak. Hanya admin atau educator yang ditugaskan.');
    }

    const { title, title_jp, description, content, phase, is_active, educator_id } = data;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (title_jp !== undefined) updates.title_jp = title_jp;
    if (description !== undefined) updates.description = description;
    if (content !== undefined) updates.content = content;
    if (phase !== undefined) updates.phase = Number(phase);
    if (is_active !== undefined && isAdmin) updates.is_active = is_active ? 1 : 0;
    if (educator_id !== undefined && isAdmin) updates.educator_id = educator_id || null;
    updates.updated_by = user.id;

    const setClauses = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(', ');
    const values = [...Object.values(updates), courseId];
    await db.query(`UPDATE courses SET ${setClauses} WHERE id = ?`, values);

    const [[updated]] = await db.query('SELECT * FROM courses WHERE id = ?', [courseId]);
    const [modules] = await db.query(
      'SELECT * FROM course_modules WHERE course_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC',
      [courseId]
    );
    return buildCourseWithModules(updated, modules);
  },

  async deleteCourse(courseId, userId) {
    await db.query('UPDATE courses SET deleted_at = NOW(), deleted_by = ? WHERE id = ?', [
      userId,
      courseId,
    ]);
    return true;
  },

  async getCourseModules(courseId) {
    const [modules] = await db.query(
      'SELECT * FROM course_modules WHERE course_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC',
      [courseId]
    );
    return modules;
  },

  async addCourseModule(courseId, data, user) {
    if (!(await canManageCourse(courseId, user))) {
      throw new AuthorizationError('Akses ditolak.');
    }
    const { title, title_jp, duration_minutes, sort_order, content } = data;
    if (!title) {
      throw new ValidationError('title modul wajib diisi.');
    }

    let order = sort_order;
    if (order === undefined || order === null) {
      const [[maxRow]] = await db.query(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM course_modules WHERE course_id = ? AND deleted_at IS NULL',
        [courseId]
      );
      order = maxRow.next_order;
    }

    const [result] = await db.query(
      'INSERT INTO course_modules (course_id, title, title_jp, content, duration_minutes, sort_order, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        courseId,
        title,
        title_jp || null,
        content || null,
        Number(duration_minutes) || 60,
        Number(order),
        user.id,
      ]
    );
    const [[moduleRow]] = await db.query('SELECT * FROM course_modules WHERE id = ?', [
      result.insertId,
    ]);
    return moduleRow;
  },

  async updateCourseModule(courseId, moduleId, data, user) {
    if (!(await canManageCourse(courseId, user))) {
      throw new AuthorizationError('Akses ditolak.');
    }
    const { title, title_jp, duration_minutes, sort_order, content } = data;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (title_jp !== undefined) updates.title_jp = title_jp;
    if (content !== undefined) updates.content = content;
    if (duration_minutes !== undefined) updates.duration_minutes = Number(duration_minutes);
    if (sort_order !== undefined) updates.sort_order = Number(sort_order);
    updates.updated_by = user.id;

    const setClauses = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(', ');
    const values = [...Object.values(updates), moduleId, courseId];
    await db.query(
      `UPDATE course_modules SET ${setClauses} WHERE id = ? AND course_id = ?`,
      values
    );

    const [[moduleRow]] = await db.query('SELECT * FROM course_modules WHERE id = ?', [moduleId]);
    return moduleRow;
  },

  async deleteCourseModule(courseId, moduleId, user) {
    if (!(await canManageCourse(courseId, user))) {
      throw new AuthorizationError('Akses ditolak.');
    }
    await db.query(
      'UPDATE course_modules SET deleted_at = NOW(), deleted_by = ? WHERE id = ? AND course_id = ?',
      [user.id, moduleId, courseId]
    );
    return true;
  },

  async enrollCourse(courseId, userId) {
    await db.query(
      `INSERT INTO course_enrollments (user_id, course_id, status, started_at)
       VALUES (?, ?, 'enrolled', NOW())
       ON DUPLICATE KEY UPDATE status = status`,
      [userId, courseId]
    );
    return true;
  },

  async updateProgress(courseId, userId, progress_pct) {
    const pct = Math.min(100, Math.max(0, Number(progress_pct) || 0));
    const status = pct === 100 ? 'completed' : pct > 0 ? 'in_progress' : 'enrolled';
    const completedAt = pct === 100 ? new Date() : null;

    await db.query(
      `INSERT INTO course_enrollments (user_id, course_id, progress_pct, status, started_at, completed_at)
       VALUES (?, ?, ?, ?, NOW(), ?)
       ON DUPLICATE KEY UPDATE
         progress_pct = VALUES(progress_pct),
         status = VALUES(status),
         completed_at = VALUES(completed_at)`,
      [userId, courseId, pct, status, completedAt]
    );
    return { pct, status };
  },
};

export default learningService;
