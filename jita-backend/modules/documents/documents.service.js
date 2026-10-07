import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { db } from '../../db.js';
import { notifyUser } from '../notifications/notifications.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_ROOT = path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const ALLOWED_MIME = {
  ktp: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  certificate: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  portfolio: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  transcript: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  badge: ['image/jpeg', 'image/png', 'image/webp'],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type || 'certificate';
    const dir = path.join(UPLOAD_ROOT, type);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const userId = req.session?.user?.id || 'anon';
    cb(null, `${Date.now()}-${userId}-${safe}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const type = req.body.type;
    if (!type || !ALLOWED_MIME[type]) {
      return cb(new Error('Tipe dokumen tidak dikenal'));
    }
    if (!ALLOWED_MIME[type].includes(file.mimetype)) {
      return cb(new Error(`Tipe file ${file.mimetype} tidak diizinkan untuk ${type}`));
    }
    cb(null, true);
  },
});

import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from '../../errors/AppError.js';

export const documentsService = {
  uploadMiddleware,

  async getMyDocuments(userId) {
    const [rows] = await db.query(
      'SELECT * FROM documents WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  async handleUpload(file, body, user) {
    if (!file) {
      throw new ValidationError('File wajib diunggah');
    }
    const { title, title_jp, type, program_name } = body;
    if (!title || !type) {
      throw new ValidationError('Title dan type wajib diisi');
    }

    const relPath = path.relative(UPLOAD_ROOT, file.path);
    const [res] = await db.query(
      `INSERT INTO documents
       (user_id, title, title_jp, type, program_name, file_path, file_size, mime_type, verification_status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        user.id,
        title,
        title_jp || null,
        type,
        program_name || null,
        relPath,
        file.size,
        file.mimetype,
        user.id,
      ]
    );

    const docId = res.insertId;

    // Auto-update profile avatar jika mengunggah badge / avatar
    if (type === 'badge') {
      await db.query('UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?', [
        relPath,
        user.id,
      ]);
    }

    // Notifikasi ke kandidat bahwa dokumen berhasil diunggah
    await notifyUser({
      userId: user.id,
      templateKey: 'document_uploaded',
      vars: { title, type },
      channel: 'in_app',
    });

    // Notifikasi ke semua admin bahwa ada dokumen yang menunggu verifikasi
    const [admins] = await db.query('SELECT id FROM users WHERE role = "admin"');
    for (const adm of admins) {
      await notifyUser({
        userId: adm.id,
        templateKey: 'document_pending_admin',
        vars: { candidateName: user.name, title, type },
        channel: 'in_app',
      });
    }

    return { id: docId };
  },

  async deleteDocument(id, user) {
    const [rows] = await db.query('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL', [
      id,
    ]);
    if (rows.length === 0) throw new NotFoundError('Dokumen tidak ditemukan');
    if (rows[0].user_id !== user.id && user.role !== 'admin') {
      throw new AuthorizationError('Akses ditolak');
    }
    // Soft Delete
    await db.query('UPDATE documents SET deleted_at = NOW(), deleted_by = ? WHERE id = ?', [
      user.id,
      id,
    ]);
    return true;
  },

  async getDocumentFile(id, user) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError('ID dokumen tidak valid');
    }

    const [rows] = await db.query('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL', [
      id,
    ]);
    if (rows.length === 0) throw new NotFoundError('Dokumen tidak ditemukan');
    const doc = rows[0];

    if (doc.user_id !== user.id && user.role !== 'admin') {
      throw new AuthorizationError('Akses ditolak ke file ini');
    }

    const safePath = path.resolve(UPLOAD_ROOT, doc.file_path);
    if (!safePath.startsWith(path.resolve(UPLOAD_ROOT)) || !fs.existsSync(safePath)) {
      throw new NotFoundError('File fisik tidak ditemukan pada server');
    }
    return safePath;
  },
};

export default documentsService;
