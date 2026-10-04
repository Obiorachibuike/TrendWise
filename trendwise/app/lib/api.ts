/**
 * Single place that builds backend URLs.
 *
 * The Express server mounts everything under `/api` (see server/src/index.ts):
 *   /api/articles, /api/comments, /api/users, /api/admin
 * but callers had drifted — articleStore used `${API}/api/articles` while
 * CommentForm, the article page and the admin page used `${API}/comments` and
 * `${API}/articles`. Those all 404'd in production. Going through this helper
 * keeps every caller on the mounted prefix.
 */
const RAW_BASE = process.env.NEXT_PUBLIC_BASE_URL ?? '';

export const API_BASE = RAW_BASE.replace(/\/+$/, '');

/** Build an absolute backend URL for a path that already includes `/api`. */
export function apiUrl(path: string): string {
  if (!API_BASE) {
    // Surfacing this loudly beats silently fetching "undefined/api/articles".
    throw new Error(
      'NEXT_PUBLIC_BASE_URL is not set. Define it at build time so the client can reach the API.'
    );
  }
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalised}`;
}

/**
 * fetch() against the backend, with JSON handling and a real error message.
 * `authToken` is the backend JWT from the NextAuth session.
 */
export async function apiFetch<T = any>(
  path: string,
  init: RequestInit & { authToken?: string } = {}
): Promise<T> {
  const { authToken, headers, ...rest } = init;

  const res = await fetch(apiUrl(path), {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.message ?? body?.error ?? '';
    } catch {
      /* non-JSON body */
    }
    throw new Error(detail || `Request failed with status ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
