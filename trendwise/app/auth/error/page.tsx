'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const errorMessages: Record<string, string> = {
  AccessDenied: 'Access Denied. You do not have permission to sign in.',
  Configuration: 'Server configuration error. Please try again later.',
  Verification: 'Invalid or expired verification token.',
  OAuthSignin: 'OAuth sign-in failed. Please try again.',
  OAuthCallback: 'OAuth callback error. Please try again.',
  OAuthCreateAccount: 'Failed to create an account via OAuth.',
  EmailSignin: 'Email sign-in failed.',
  CredentialsSignin: 'Sign-in failed. Check your credentials.',
  default: 'Something went wrong during sign-in.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error') || 'default';
  const message = errorMessages[error] || errorMessages.default;

  useEffect(() => {
    // Optional: auto-redirect back to login page after few seconds
    const timer = setTimeout(() => {
      router.push('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
      <div className="max-w-md bg-white shadow-lg rounded p-6 text-center border border-red-300">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Sign-In Error</h1>
        <p className="text-gray-700 mb-4">{message}</p>
        <p className="text-sm text-gray-500">Redirecting to login...</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-6 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
