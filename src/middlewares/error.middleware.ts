import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../logger';
import { env } from '../config/env';

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): Response {
  if (err instanceof ZodError) {
    const errorDetails = err.errors.map((e) => {
      const path = e.path.join('.');
      return path ? `${path}: ${e.message}` : e.message;
    });

    return res.status(400).json({
      message: 'Validation failed',
      errors: errorDetails,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  // Handle standard JSON parsing or library-specific status errors
  if (err.status && typeof err.status === 'number') {
    return res.status(err.status).json({
      message: err.message,
    });
  }

  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
      },
      method: req.method,
      url: req.originalUrl,
    },
    'Internal Server Error'
  );

  const responseMessage =
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error';

  return res.status(500).json({
    message: responseMessage,
  });
}
