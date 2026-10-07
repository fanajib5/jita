import { db } from '../../db.js';
import { ValidationError, NotFoundError } from '../../errors/AppError.js';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export const postsService = {
  async ensureTable() {
    await db.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        title_jp VARCHAR(255) NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        category ENUM('announcement', 'article', 'event') NOT NULL,
        source_name VARCHAR(100) NOT NULL,
        source_type ENUM('ice_center', 'corporate', 'partner_educator', 'official') NOT NULL,
        author_name VARCHAR(100) NULL,
        excerpt TEXT NULL,
        content LONGTEXT NOT NULL,
        cover_image VARCHAR(500) NULL,
        event_date DATETIME NULL,
        event_location VARCHAR(255) NULL,
        external_link VARCHAR(500) NULL,
        tags VARCHAR(255) NULL,
        is_pinned TINYINT(1) DEFAULT 0,
        is_published TINYINT(1) DEFAULT 1,
        views_count INT DEFAULT 0,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        deleted_by INT NULL,
        INDEX idx_cat_pub (category, is_published, deleted_at),
        INDEX idx_source (source_type, deleted_at),
        INDEX idx_pinned (is_pinned, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  },

  async getPosts({ category, sourceType, search, page = 1, limit = 10, publishedOnly = true }) {
    await this.ensureTable();
    const offset = (Number(page) - 1) * Number(limit);
    let whereClause = 'WHERE p.deleted_at IS NULL';
    const params = [];

    if (publishedOnly) {
      whereClause += ' AND p.is_published = 1';
    }

    if (category && ['announcement', 'article', 'event'].includes(category)) {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

    if (sourceType && ['ice_center', 'corporate', 'partner_educator', 'official'].includes(sourceType)) {
      whereClause += ' AND p.source_type = ?';
      params.push(sourceType);
    }

    if (search) {
      whereClause += ' AND (p.title LIKE ? OR p.excerpt LIKE ? OR p.source_name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const countQuery = `SELECT COUNT(*) as total FROM posts p ${whereClause}`;
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0]?.total || 0;

    const dataQuery = `
      SELECT p.id, p.title, p.title_jp, p.slug, p.category, p.source_name, p.source_type,
             p.author_name, p.excerpt, p.cover_image, p.event_date, p.event_location,
             p.external_link, p.tags, p.is_pinned, p.is_published, p.views_count, p.created_at, p.updated_at
      FROM posts p
      ${whereClause}
      ORDER BY p.is_pinned DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [posts] = await db.query(dataQuery, [...params, Number(limit), offset]);

    return {
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  },

  async getPostBySlugOrId(identifier) {
    await this.ensureTable();
    const isId = /^\d+$/.test(identifier);
    const query = isId
      ? 'SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL'
      : 'SELECT * FROM posts WHERE slug = ? AND deleted_at IS NULL';
    const [rows] = await db.query(query, [identifier]);

    if (!rows || rows.length === 0) {
      throw new NotFoundError('Konten informasi tidak ditemukan.');
    }

    // Increment views count asynchronously
    db.query('UPDATE posts SET views_count = views_count + 1 WHERE id = ?', [rows[0].id]).catch(() => {});

    return rows[0];
  },

  async createPost(data, userId) {
    await this.ensureTable();
    const {
      title,
      title_jp,
      slug,
      category,
      source_name,
      source_type,
      author_name,
      excerpt,
      content,
      cover_image,
      event_date,
      event_location,
      external_link,
      tags,
      is_pinned = 0,
      is_published = 1,
    } = data;

    if (!title || !category || !source_name || !source_type || !content) {
      throw new ValidationError('Judul, kategori, nama sumber, tipe sumber, dan konten wajib diisi.');
    }

    const postSlug = slugify(slug || title) + '-' + Date.now().toString(36);

    const [result] = await db.query(
      `INSERT INTO posts (
        title, title_jp, slug, category, source_name, source_type, author_name,
        excerpt, content, cover_image, event_date, event_location, external_link,
        tags, is_pinned, is_published, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        title_jp || null,
        postSlug,
        category,
        source_name,
        source_type,
        author_name || null,
        excerpt || null,
        content,
        cover_image || null,
        event_date || null,
        event_location || null,
        external_link || null,
        tags || null,
        is_pinned ? 1 : 0,
        is_published ? 1 : 0,
        userId,
      ]
    );

    return this.getPostBySlugOrId(result.insertId);
  },

  async updatePost(id, data, userId) {
    await this.ensureTable();
    const existing = await this.getPostBySlugOrId(id);

    const {
      title,
      title_jp,
      category,
      source_name,
      source_type,
      author_name,
      excerpt,
      content,
      cover_image,
      event_date,
      event_location,
      external_link,
      tags,
      is_pinned,
      is_published,
    } = data;

    await db.query(
      `UPDATE posts SET
        title = COALESCE(?, title),
        title_jp = COALESCE(?, title_jp),
        category = COALESCE(?, category),
        source_name = COALESCE(?, source_name),
        source_type = COALESCE(?, source_type),
        author_name = COALESCE(?, author_name),
        excerpt = COALESCE(?, excerpt),
        content = COALESCE(?, content),
        cover_image = COALESCE(?, cover_image),
        event_date = ?,
        event_location = ?,
        external_link = ?,
        tags = COALESCE(?, tags),
        is_pinned = COALESCE(?, is_pinned),
        is_published = COALESCE(?, is_published),
        updated_by = ?
      WHERE id = ?`,
      [
        title ?? null,
        title_jp ?? null,
        category ?? null,
        source_name ?? null,
        source_type ?? null,
        author_name ?? null,
        excerpt ?? null,
        content ?? null,
        cover_image ?? null,
        event_date !== undefined ? event_date : existing.event_date,
        event_location !== undefined ? event_location : existing.event_location,
        external_link !== undefined ? external_link : existing.external_link,
        tags ?? null,
        is_pinned !== undefined ? (is_pinned ? 1 : 0) : existing.is_pinned,
        is_published !== undefined ? (is_published ? 1 : 0) : existing.is_published,
        userId,
        existing.id,
      ]
    );

    return this.getPostBySlugOrId(existing.id);
  },

  async deletePost(id, userId) {
    await this.ensureTable();
    const existing = await this.getPostBySlugOrId(id);
    await db.query(
      'UPDATE posts SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ?',
      [userId, existing.id]
    );
    return true;
  },
};

export default postsService;
