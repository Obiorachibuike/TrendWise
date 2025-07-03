import { NextResponse } from 'next/server';

export async function GET() {
  const body = `User-agent: *
Disallow: /admin
Allow: /

Sitemap: ${process.env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`;

  return new NextResponse(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}
