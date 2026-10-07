import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { config } from './config/index.js';
import { logger } from './shared/logger.js';
import { sanitizeMiddleware } from './middlewares/sanitize.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

// Domain Routes
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import eventsRoutes from './modules/events/events.routes.js';
import learningRoutes from './modules/learning/learning.routes.js';
import documentsRoutes from './modules/documents/documents.routes.js';
import opportunitiesRoutes from './modules/opportunities/opportunities.routes.js';
import cvRoutes from './modules/cv/cv.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import postsRoutes from './modules/posts/posts.routes.js';
import { db } from './db.js';

export const app = express();

// ── 0. HTTP LOGGING (Pino) ───────────────────────────────────────────
if ((!config.isProduction || process.env.LOG_HTTP === 'true') && process.env.NODE_ENV !== 'test') {
  app.use(pinoHttp({ logger }));
}

// ── 1. URL REWRITER MIDDLEWARE (cPanel Passenger Support) ────────────
// cPanel Passenger me-mount aplikasi pada /api dan memotong prefix /api dari req.url.
app.use((req, res, next) => {
  if (req.url === '/' || req.url.startsWith('/api')) {
    return next();
  }
  req.url = '/api' + req.url;
  next();
});

// ── 2. KEAMANAN, CORS & PARSERS ──────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Reverse proxy (Coolify/Traefik, cPanel): percayai 1 lapis proxy
app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Akses diblokir oleh kebijakan CORS'));
      }
    },
    credentials: true,
  })
);

// ── 3. SANITASI DATA SENSITIF & AUDIT INTERNAL ──────────────────────
app.use(sanitizeMiddleware);

// ── 4. SESSION ───────────────────────────────────────────────────────
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.cookieSecure,
      maxAge: 7 * 24 * 3600 * 1000, // 7 Hari
    },
  })
);

// ── 5. RATE LIMITERS ─────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: { message: 'Terlalu banyak request, silakan tunggu 1 menit.' },
  },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: {
    success: false,
    error: { message: 'Terlalu banyak percobaan autentikasi, silakan tunggu 1 menit.' },
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: { message: 'Batas unggah tercapai, silakan coba lagi setelah 15 menit.' },
  },
});
app.use('/api/documents/upload', uploadLimiter);

const cvLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: { message: 'Batas pembuatan CV tercapai, silakan tunggu sebentar.' },
  },
});
app.use('/api/cv', cvLimiter);

// ── 6. SYSTEM ROUTES: ROOT, HEALTH & DOCS ────────────────────────────
app.get('/', (req, res) => {
  res.status(200).send('JITA Backend API is running.');
});

app.get('/api/docs.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: { title: 'JITA API', version: '1.0.0' },
    paths: { '/jobs': {}, '/auth': {}, '/documents': {}, '/cv': {} },
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, db: 'up' });
  } catch {
    res.status(500).json({ ok: false, db: 'down' });
  }
});

// ── 7. DOMAIN MODULE ROUTERS ─────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api', usersRoutes);
app.use('/api', eventsRoutes);
app.use('/api', learningRoutes);
app.use('/api', documentsRoutes);
app.use('/api', opportunitiesRoutes);
app.use('/api', cvRoutes);
app.use('/api', adminRoutes);
app.use('/api', notificationsRoutes);
app.use('/api', postsRoutes);

// ── 8. 404 & CENTRALIZED ERROR HANDLING ──────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
