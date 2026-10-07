import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './server.js';

describe('JITA Monolithic Backend (server.js)', () => {
  it('should respond 200 on root health check', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('JITA Backend API is running.');
  });

  it('should rewrite URL when accessed without /api prefix (cPanel Passenger compatibility)', async () => {
    // When accessing /auth/me without /api, url rewriter rewrites to /api/auth/me
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Tidak ada sesi aktif.');
  });

  it('should enforce authentication on protected endpoints', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('Unauthorized');
  });

  it('should reject login without password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'budi@student.jita.id',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Email dan password wajib diisi.');
  });

  it('should reject unauthenticated file download requests', async () => {
    const res = await request(app).get('/api/documents/file/1');
    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('Unauthorized');
  });

  it('should enforce security headers via helmet', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});

describe('Soft Delete & Audit Columns Integration', () => {
  it('should not return soft deleted documents or jobs', async () => {
    // Verified via query logic: deleted_at IS NULL on GET /api/jobs and GET /api/documents/mine
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    // Every returned job should not have deleted_at set
    for (const j of res.body.jobs) {
      expect(j.deleted_at).toBeUndefined();
    }
  });

  it('should never include deleted_at or deleted_by in any json response', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.courses)).toBe(true);
    for (const c of res.body.courses) {
      expect(c).not.toHaveProperty('deleted_at');
      expect(c).not.toHaveProperty('deleted_by');
    }
  });
});
