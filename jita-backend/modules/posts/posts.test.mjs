import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { db } from '../../db.js';
import { app } from '../../app.js';

describe('Posts Module (Unified Informasi Hub) Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/posts - should return list of posts and pagination', async () => {
    const mockPosts = [
      {
        id: 1,
        title: 'Pendaftaran Gelombang 2 JITA x Pusat Es',
        slug: 'pendaftaran-gelombang-2',
        category: 'announcement',
        source_name: 'Pusat Es Kampus',
        source_type: 'ice_center',
        excerpt: 'Pendaftaran dibuka untuk mahasiswa Kampus.',
        is_pinned: 1,
        is_published: 1,
        created_at: new Date().toISOString(),
      },
    ];

    // Mock ensureTable query, count query, data query
    vi.spyOn(db, 'query').mockImplementation(async (sql) => {
      if (typeof sql === 'string' && sql.includes('CREATE TABLE IF NOT EXISTS posts')) {
        return [{}];
      }
      if (typeof sql === 'string' && sql.includes('COUNT(*) as total')) {
        return [[{ total: 1 }]];
      }
      if (typeof sql === 'string' && sql.includes('SELECT p.id')) {
        return [mockPosts];
      }
      return [[]];
    });

    const res = await request(app).get('/api/posts?category=announcement');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.posts)).toBe(true);
    expect(res.body.posts.length).toBe(1);
    expect(res.body.posts[0].category).toBe('announcement');
    expect(res.body.pagination.total).toBe(1);
  });

  it('GET /api/posts/:slug - should return single post detail', async () => {
    const mockDetail = {
      id: 2,
      title: 'Live Webinar: Karir di KS Global',
      slug: 'live-webinar-karir-ks-global',
      category: 'event',
      source_name: 'KS Global Japan',
      source_type: 'corporate',
      content: '<p>Detail webinar...</p>',
      event_date: '2026-10-18T13:30:00.000Z',
      event_location: 'Zoom Meeting',
    };

    vi.spyOn(db, 'query').mockImplementation(async (sql) => {
      if (typeof sql === 'string' && sql.includes('CREATE TABLE IF NOT EXISTS posts')) {
        return [{}];
      }
      if (typeof sql === 'string' && sql.includes('SELECT * FROM posts WHERE slug = ?')) {
        return [[mockDetail]];
      }
      if (typeof sql === 'string' && sql.includes('UPDATE posts SET views_count')) {
        return [{}];
      }
      return [[]];
    });

    const res = await request(app).get('/api/posts/live-webinar-karir-ks-global');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.post.title).toBe('Live Webinar: Karir di KS Global');
    expect(res.body.post.category).toBe('event');
  });

  it('POST /api/posts - should require admin authentication', async () => {
    const res = await request(app).post('/api/posts').send({
      title: 'Artikel Baru',
      category: 'article',
      source_name: 'Yuki Engineering',
      source_type: 'corporate',
      content: 'Isi artikel',
    });
    // Unauthenticated request should return 401
    expect(res.status).toBe(401);
  });
});
