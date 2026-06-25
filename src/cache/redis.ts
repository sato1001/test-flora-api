import { createClient } from 'redis';
import { env } from '../config/env';
import { logger } from '../logger';

export const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (err) => {
  logger.error({ err }, 'Redis Client Error');
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

let isConnected = false;

export async function connectRedis(): Promise<void> {
  if (env.NODE_ENV === 'test') {
    return; // Skip connecting in test environments to avoid blocking Jest/Vitest
  }
  if (!isConnected) {
    try {
      await redisClient.connect();
      isConnected = true;
    } catch (error) {
      logger.error({ error }, 'Failed to connect to Redis');
    }
  }
}

export async function disconnectRedis(): Promise<void> {
  if (isConnected) {
    try {
      await redisClient.disconnect();
      isConnected = false;
      logger.info('Redis Client Disconnected');
    } catch (error) {
      logger.error({ error }, 'Error disconnecting Redis');
    }
  }
}

const DEFAULT_TTL = 24 * 60 * 60; // 24 hours in seconds

export async function getCache(key: string): Promise<string | null> {
  if (!isConnected) return null;
  try {
    return await redisClient.get(key);
  } catch (error) {
    logger.error({ error, key }, 'Redis get cache error');
    return null;
  }
}

export async function setCache(key: string, value: string, ttl: number = DEFAULT_TTL): Promise<void> {
  if (!isConnected) return;
  try {
    await redisClient.set(key, value, {
      EX: ttl,
    });
  } catch (error) {
    logger.error({ error, key }, 'Redis set cache error');
  }
}
