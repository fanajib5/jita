import { createRequire } from 'node:module';
import pino from 'pino';

const require = createRequire(import.meta.url);
const isProduction = process.env.NODE_ENV === 'production';

let hasPinoPretty = false;
if (!isProduction) {
  try {
    require.resolve('pino-pretty');
    hasPinoPretty = true;
  } catch {
    hasPinoPretty = false;
  }
}

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport:
    !isProduction && hasPinoPretty
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

export default logger;
