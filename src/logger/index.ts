import pino from 'pino';
import { env } from '../config/env';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'headers.authorization',
      'password',
      'password_hash',
      'passwordHash',
      'token',
      'jwt',
    ],
    censor: '[REDACTED]',
  },
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});
