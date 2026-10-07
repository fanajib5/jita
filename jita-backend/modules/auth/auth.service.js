import bcrypt from 'bcryptjs';
import { db } from '../../db.js';
import {
  verifyIceJwtLocally,
  validateTokenWithIceCenter,
} from './iceSso.service.js';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  AppError,
} from '../../errors/AppError.js';

export const authService = {
  /**
   * Proses login SSO Pusat Es:
   * 1. Verifikasi lokal RS256, iss, aud, exp
   * 2. Panggil remote /validate untuk cek revocation & sinkron database es
   * 3. Provisioning atau sinkronisasi user di database lokal
   */
  async handleIceSsoLogin(token) {
    if (!token) {
      throw new ValidationError('Token missing');
    }

    // Step 1: Local RS256 Verification
    const localVerification = await verifyIceJwtLocally(token);
    if (!localVerification.valid) {
      throw new AuthenticationError(`Verifikasi JWT RS256 gagal: ${localVerification.error}`);
    }

    // Step 2: Remote Revocation & DB Check (/validate)
    let iceData;
    try {
      iceData = await validateTokenWithIceCenter(token);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      throw new AppError(`Gagal berkomunikasi dengan Pusat Es SSO: ${errMsg}`, 502, 'BAD_GATEWAY');
    }

    if (!iceData || !iceData.valid) {
      throw new AuthenticationError(`Token tidak valid di Pusat Es: ${iceData?.reason || 'Unknown reason'}`);
    }

    const iceUserId = iceData.user_id ? iceData.user_id.toString() : '';
    const email = iceData.email;
    const name = iceData.name;

    // Step 3: Local User Sync / Provisioning
    const [users] = await db.query(
      'SELECT * FROM users WHERE ice_uuid = ? OR email = ?',
      [iceUserId, email]
    );

    let userId;
    let role = 'student';

    if (users.length > 0) {
      userId = users[0].id;
      role = users[0].role;
      if (!users[0].ice_uuid && iceUserId) {
        await db.query('UPDATE users SET ice_uuid = ? WHERE id = ?', [iceUserId, userId]);
      }
    } else {
      const dummyPassword = await bcrypt.hash(Math.random().toString(), 10);
      const [result] = await db.query(
        'INSERT INTO users (name, email, password_hash, role, ice_uuid) VALUES (?, ?, ?, ?, ?)',
        [name, email, dummyPassword, role, iceUserId]
      );
      userId = result.insertId;
    }

    return {
      id: userId,
      name,
      email,
      role,
      ice_uuid: iceUserId,
    };
  },

  async registerUser({ name, email, password, iceUuid }) {
    if (!name || !email || !password) {
      throw new ValidationError('Nama, email, dan password wajib diisi.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Format email tidak valid.');
    }
    if (password.length < 6) {
      throw new ValidationError('Password minimal 6 karakter.');
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new ConflictError('Email sudah terdaftar.');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role, ice_uuid) VALUES (?, ?, ?, ?, ?)',
      [name, email, password_hash, 'student', iceUuid || null]
    );

    return {
      id: result.insertId,
      name,
      email,
      role: 'student',
      ice_uuid: iceUuid || null,
    };
  },

  async loginLocal({ email, password }) {
    if (!email || !password) {
      throw new ValidationError('Email dan password wajib diisi.');
    }

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (users.length === 0) {
      throw new AuthenticationError('Email atau password salah.');
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new AuthenticationError('Email atau password salah.');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ice_uuid: user.ice_uuid,
    };
  },
};

export default authService;
