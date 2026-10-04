import { NextResponse } from 'next/server';

/**
 * Sitemap for the static pages plus every published article.
 *
 * robots.txt advertised `${site}/sitemap.xml` but no such route existed, so
 * crawlers followed the reference straight into a 404.
 *
 * NOTE: the repo-root .gitignore used to contain a bare `sitemap.xml` pattern,
 * which matches at any depth and silently ignored this whole route directory.
 * It is now anchored to `/sitemap.xml`. If this file ever vanishes from a
 * commit, check that rule first.
 */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXTAUTH_URL ??
  ''
).replace(/\/+$/, '');

const API_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '');

const STATIC_PATHS = ['', '/about', '/contact', '/privacy', '/login'];

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string)
  );

async function fetchArticleSlugs(): Promise<string[]> {
  if (!API_URL) return [];

  try {
    const res = await fetch(`${API_URL}/api/articles`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .map((a: any) => (a?._id ? `/article/${a._id}` : null))
      .filter((p: string | null): p is string => Boolean(p));
  } catch (err: any) {
    console.error('⚠️ sitemap: could not load articles:', err?.message ?? err);
    return [];
  }
}

export async function GET() {
  const articlePaths = await fetchArticleSlugs();
  const paths = [...STATIC_PATHS, ...articlePaths];

  const urls = paths
    .map((path) => {
      const loc = `${SITE_URL}${path}`;
      const priority = path === '' ? '1.0' : path.startsWith('/article/') ? '0.7' : '0.5';
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
