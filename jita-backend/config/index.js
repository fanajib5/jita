import 'dotenv/config';

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'jita_secure_secret',
  cookieSecure:
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production',
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://ijon-technology.com'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'oralunas_jitaadmin',
    password: process.env.DB_PASSWORD || 'kampus2026!',
    database: process.env.DB_NAME || 'oralunas_jitadb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
  iceSso: {
    baseUrl: process.env.ES_SSO_BASE_URL || 'https://pusates.kampus.ac.id/wp-json/ice-sso/v1',
    issuer: process.env.ES_SSO_ISSUER || 'https://pusates.kampus.ac.id/id',
    audience: process.env.ES_SSO_AUDIENCE || 'ijete',
  },
  smtp: {
    host: process.env.SMTP_HOST || null,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null,
    from: process.env.SMTP_FROM || 'JITA <noreply@jita.id>',
  },
  notificationWebhook: {
    url: process.env.NOTIFICATION_WEBHOOK_URL || null,
    secret: process.env.NOTIFICATION_WEBHOOK_SECRET || '',
  },
};

export default config;
