import './globals.css';
import type { Metadata } from 'next';
import SessionWrapper from './components/SessionWrapper';
import Header from './components/Header';
import Footer from './components/Footer';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? 'https://trendwise.vercel.app'
).replace(/\/+$/, '');

/**
 * SEO now uses the App Router `metadata` export.
 *
 * `ClientWrapper` used `DefaultSeo` from next-seo, which renders through
 * `next/head`. `next/head` is a Pages Router API and is unsupported here — it
 * threw "Cannot read properties of null (reading 'useContext')" while Next was
 * prerendering `/_not-found`, which aborted the whole production build.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'TrendWise Blog',
    template: '%s | TrendWise',
  },
  description: 'AI-generated trending content blog.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${SITE_URL}/`,
    siteName: 'TrendWise',
    title: 'TrendWise Blog',
    description: 'AI-generated trending content blog.',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {/*
          One SessionProvider, and `children` rendered exactly once.
          The previous markup mounted two SessionWrappers and rendered
          {children} twice — every page's content, ids and data fetches were
          duplicated.
        */}
        <SessionWrapper>
          <Header />
          {/* A div, not <main> — each page renders its own <main>. */}
          <div className="flex-1">{children}</div>
          <Footer />
        </SessionWrapper>
      </body>
    </html>
  );
}
