import { app } from './app';
import { env } from './config/env';
import { logger } from './logger';
import { connectRedis, disconnectRedis } from './cache/redis';
import { prisma } from './database/prisma';

const server = app.listen(env.PORT, async () => {
  logger.info(` Application successfully initialized in ${env.NODE_ENV} mode on port ${env.PORT}`);
  await connectRedis();
});

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Received shutdown signal. Commencing graceful termination...');

  // 1. Tell Express to stop accepting connections
  server.close(async () => {
    logger.info('HTTP server terminated.');

    try {
      // 2. Shut down Redis connection
      await disconnectRedis();

      // 3. Shut down Prisma Connection
      await prisma.$disconnect();
      logger.info('All database and cache resources released.');

      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Failed to release all resources during shutdown');
      process.exit(1);
    }
  });

  // Force kill if graceful shutdown hangs (10 seconds timeout)
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcefully killing process.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
