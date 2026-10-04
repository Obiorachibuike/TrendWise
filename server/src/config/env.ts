import dotenv from 'dotenv';

dotenv.config();

/**
 * Single source of truth for the JWT signing secret.
 *
 * Previously `user.controller.ts` fell back to `'your_jwt_secret'` while
 * `middleware/auth.ts` fell back to `''`, so if JWT_SECRET was missing from the
 * environment every token was signed with one secret and verified against
 * another — every authenticated request 401'd. Resolving it once, here, makes
 * that divergence impossible.
 */
const FALLBACK_SECRET = 'your_jwt_secret';

const resolved = process.env.JWT_SECRET;

if (!resolved) {
  console.warn(
    '⚠️  JWT_SECRET is not set — falling back to an insecure built-in secret. ' +
      'Set JWT_SECRET in the environment before running in production.'
  );
}

export const JWT_SECRET: string = resolved || FALLBACK_SECRET;

export const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
