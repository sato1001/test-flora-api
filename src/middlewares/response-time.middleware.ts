import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export function responseTimeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Intercept writeHead to set the response time header before headers are sent
  const originalWriteHead = res.writeHead;
  res.writeHead = function (statusCode: number, ...args: any[]): any {
    const duration = Date.now() - start;
    res.setHeader('x-response-time', `${duration}ms`);
    return originalWriteHead.apply(this, [statusCode, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        responseTime: `${duration}ms`,
        cache: res.getHeader('x-cache') || 'MISS',
      },
      'HTTP Request finished'
    );
  });

  next();
}
