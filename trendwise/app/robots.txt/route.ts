import { NextResponse } from 'next/server';

/**
 * robots.txt for the public site.
 *
 * The Sitemap line used `NEXT_PUBLIC_BASE_URL`, which is the *API* origin, so
 * crawlers were handed a sitemap URL on the backend domain. It now uses the
 * site origin.
 */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXTAUTH_URL ??
  ''
).replace(/\/+$/, '');

export async function GET() {
  const body = `User-agent: *
Disallow: /admin
Allow: /
${SITE_URL ? `\nSitemap: ${SITE_URL}/sitemap.xml` : ''}`.trim();

  return new NextResponse(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
