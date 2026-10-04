import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      userId?: string;
      email?: string;
      [key: string]: any;
    };
  }
}

/**
 * Verifies the `Authorization: Bearer <token>` header.
 *
 * The payload signed in `user.controller.generateToken` is `{ userId, email }`,
 * so the decoded object has no `id` key. Normalising both here keeps every
 * downstream consumer (isAdmin, controllers) working regardless of which name
 * the issuer used.
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token missing or malformed' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const id = decoded.userId ?? decoded.id;

    if (!id) {
      res.status(401).json({ error: 'Token does not identify a user' });
      return;
    }

    req.user = { ...decoded, id, userId: id };
    next();
  } catch (err) {
    console.error('JWT verification failed:', (err as Error).message);
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};
