import { Request, Response, NextFunction } from 'express';

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
 * Restricts a route to the configured admin.
 *
 * The identity comes ONLY from the verified JWT (populated by verifyToken).
 * The previous version also accepted `req.body.userId` and an `x-user-id`
 * header, which let any authenticated user claim to be the admin by putting
 * the admin's id in the request body. Those fallbacks are gone.
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const adminId = process.env.ADMIN_USER_ID;

  if (!adminId) {
    console.error('❌ ADMIN_USER_ID is not set — refusing the request rather than guessing.');
    res.status(500).json({ message: 'ADMIN_USER_ID not set in environment variables' });
    return;
  }

  // verifyToken normalises the claim to both `id` and `userId`.
  const userId = req.user?.userId ?? req.user?.id;

  if (userId !== adminId) {
    res.status(403).json({ message: 'Access denied. Admins only.' });
    return;
  }

  next();
};
