import { db } from '../../db.js';

export function formatUserProfile(u) {
  return {
    id: u.id,
    name: u.name,
    nameJp: u.name_jp,
    email: u.email,
    role: u.role,
    title: u.title,
    company: u.company_name,
    originCity: u.origin_city,
    phone: u.phone,
    birthDate: u.birth_date,
    jlptLevel: u.jlpt_level,
    specialization: u.specialization
      ? u.specialization
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    education:
      typeof u.education_json === 'string'
        ? JSON.parse(u.education_json || '[]')
        : u.education_json || [],
    experience:
      typeof u.experience_json === 'string'
        ? JSON.parse(u.experience_json || '[]')
        : u.experience_json || [],
    skills:
      typeof u.skills_json === 'string'
        ? JSON.parse(u.skills_json || '[]')
        : u.skills_json || [],
    bioId: u.bio_id,
    bioJp: u.bio_jp,
    profileVerified: Boolean(u.profile_verified),
  };
}

import { NotFoundError } from '../../errors/AppError.js';

export const usersService = {
  async getCurrentUser(userId) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
      [userId]
    );
    if (rows.length === 0) {
      throw new NotFoundError('User tidak ditemukan');
    }
    return formatUserProfile(rows[0]);
  },

  async updateCurrentUser(userId, data) {
    const allowed = [
      'name',
      'name_jp',
      'phone',
      'origin_city',
      'birth_date',
      'jlpt_level',
      'specialization',
      'education_json',
      'experience_json',
      'skills_json',
      'bio_id',
      'bio_jp',
    ];
    const updates = {};
    for (const k of allowed) {
      if (data[k] !== undefined) {
        if (['education_json', 'experience_json', 'skills_json'].includes(k)) {
          updates[k] = typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k];
        } else {
          updates[k] = data[k];
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      const setClauses = Object.keys(updates)
        .map((k) => `${k} = ?`)
        .join(', ');
      const values = [...Object.values(updates), userId];
      await db.query(`UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = ?`, values);
    }

    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    return formatUserProfile(rows[0]);
  },
};

export default { formatUserProfile, usersService };
