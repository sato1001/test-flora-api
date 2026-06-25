import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  id: string;
  name: string;
  email: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void | Response {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return res.status(401).json({ message: 'Invalid token format. Expected: Bearer <token>' });
  }

  const [scheme, token] = parts;
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Invalid token format. Expected: Bearer <token>' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token' });
  }
}
