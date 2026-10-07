import { fileURLToPath } from 'url';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './shared/logger.js';
import { initSchema } from './seeder.js';

// Version endpoint
app.get('/api/version', (req, res) => {
  try {
    const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
    const commit = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
    res.json({ commit, branch });
  } catch {
    res.json({ commit: 'unknown', branch: 'unknown' });
  }
});

const MAX_INIT_RETRIES = 10;
const runInitSchema = (attempt = 1) => {
  initSchema()
    .then(() => {
      logger.info('Database schema & columns verified.');
    })
    .catch((err) => {
      logger.warn(
        `Auto initSchema gagal (percobaan ${attempt}/${MAX_INIT_RETRIES}): ${err.message}`
      );
      if (attempt < MAX_INIT_RETRIES) {
        setTimeout(() => runInitSchema(attempt + 1), 3000);
      }
    });
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runInitSchema();
  const server = app.listen(config.port, () => {
    logger.info(`JITA Backend Pilot berjalan di port ${config.port} (${config.env})`);
  });

  // Graceful shutdown
  const handleShutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

export default app;
