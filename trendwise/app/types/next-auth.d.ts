import { DefaultSession } from 'next-auth';

/**
 * The NextAuth session carries the backend identity alongside the OAuth
 * profile: `id` is the Mongo user id the API expects as `userId`, and `token`
 * is the backend JWT signed by POST /api/users. Client components send it as
 * `Authorization: Bearer <token>` for the protected endpoints (comments,
 * admin).
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      token?: string;
      role?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    token?: string;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    token?: string;
    role?: string;
    /** Epoch ms at which the backend JWT expires (5h TTL, minted server-side). */
    expiresAt?: number;
  }
}
