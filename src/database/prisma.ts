import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../logger';

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Bind client logs to our Pino logger
if (env.NODE_ENV === 'development') {
  // We can listen to events or just rely on standard Prisma logging
  logger.info('Database client initialized with verbose logging');
} else {
  logger.info('Database client initialized');
}
