import { db } from '../../db.js';

import { ValidationError } from '../../errors/AppError.js';

export const eventsService = {
  async getEvents({ from, to, type }) {
    let query = 'SELECT * FROM calendar_events WHERE deleted_at IS NULL';
    const params = [];
    if (from) {
      query += ' AND start_at >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND end_at <= ?';
      params.push(to);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    query += ' ORDER BY start_at ASC';
    const [rows] = await db.query(query, params);
    return rows;
  },

  async createEvent(data, userId) {
    const { title, title_jp, description, start_at, end_at, type, visibility } = data;
    if (!title || !start_at || !end_at) {
      throw new ValidationError('Title, start_at, and end_at are required');
    }
    const [result] = await db.query(
      `INSERT INTO calendar_events (title, title_jp, description, start_at, end_at, type, visibility, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        title_jp || null,
        description || null,
        start_at,
        end_at,
        type || 'class',
        visibility || 'student',
        userId,
      ]
    );
    const [created] = await db.query('SELECT * FROM calendar_events WHERE id = ?', [
      result.insertId,
    ]);
    return created[0];
  },

  async deleteEvent(eventId, userId) {
    await db.query(
      'UPDATE calendar_events SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ?',
      [userId, eventId]
    );
    return true;
  },
};

export default eventsService;
