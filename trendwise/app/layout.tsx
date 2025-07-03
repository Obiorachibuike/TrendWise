import './globals.css';
import type { Metadata } from 'next';
import SessionWrapper from './components/SessionWrapper';
import ClientWrapper from './components/ClientWrapper';
<<<<<<< HEAD
=======
import { GoogleOAuthProvider } from '@react-oauth/google';
// import ClientWrapper from '../components/ClientWrapper'; // ✅ client component
import Header from "./components/Header"
import Footer from "./components/Footer"

>>>>>>> d62e2fa (updated)

export const metadata: Metadata = {
  title: 'TrendWise Blog',
  description: 'AI-generated trending content blog.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
<<<<<<< HEAD
        <SessionWrapper>
          <ClientWrapper>{children}</ClientWrapper>
        </SessionWrapper>
=======
           {/* <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}> */}

        <SessionWrapper>
            <Header />
          <ClientWrapper>
            {children}
           
          </ClientWrapper>
            <Footer />
        </SessionWrapper>
           {/* </GoogleOAuthProvider> */}
>>>>>>> d62e2fa (updated)
      </body>
    </html>
  );
}