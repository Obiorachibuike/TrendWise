import { Request, Response, NextFunction } from 'express';

// Extend Express.Request to ensure `req.user` is recognized
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email?: string;
      [key: string]: any;
    };
  }
}

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const adminId = process.env.ADMIN_USER_ID;

  if (!adminId) {
    res.status(500).json({ message: 'ADMIN_USER_ID not set in environment variables' });
    return;
  }

  const userId =
    req.user?.id ||
    req.body.userId || // fallback (optional)
    req.headers['x-user-id']; // fallback (optional)

  if (userId !== adminId) {
    res.status(403).json({ message: 'Access denied. Admins only.' });
    return;
  }

  next();
};
