import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ✅ Only define this once — here
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email?: string;
      [key: string]: any;
    };
  }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token missing or malformed' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any;
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};
