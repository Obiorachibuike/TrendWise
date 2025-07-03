'use client';
import { DefaultSeo } from 'next-seo';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DefaultSeo
        title="TrendWise Blog"
        description="AI-generated trending content blog."
        openGraph={{
          type: "website",
          locale: "en_US",
          url: "https://trendwise.vercel.app/",
          siteName: "TrendWise",
        }}
        twitter={{ cardType: "summary_large_image" }}
      />
      {children}
    </>
  );
}
