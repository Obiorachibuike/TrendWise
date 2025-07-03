'use client';
import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#204079] to-[#2a5298]">
      <div className="bg-white shadow-xl rounded-lg p-8 max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to TrendWise</h2>

        {session ? (
          <>
            <p className="text-gray-700 mb-6">
              Logged in as <span className="font-semibold">{session.user?.name}</span>
            </p>
            <img
              src={session.user?.image ?? "/user.png"}
              alt="Profile"
              className="w-16 h-16 rounded-full mx-auto mb-4"
            />
            <button
              onClick={() => signOut()}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition-all"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-6">Login to read wonderful article</p>
            <button
              onClick={() => signIn("google")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-all flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path fill="#4285F4" d="M24 9.5c3.54 0 6.65 1.34 9.1 3.52l6.8-6.8C36.45 2.6 30.64 0 24 0 14.85 0 7.14 5.36 3.1 13.13l7.9 6.13C13.15 13.25 18.2 9.5 24 9.5z" />
                <path fill="#34A853" d="M46.45 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.75c-.55 2.9-2.14 5.36-4.52 7.03l7.15 5.56C43.47 37.46 46.45 31.4 46.45 24.5z" />
                <path fill="#FBBC05" d="M10.98 28.3a14.47 14.47 0 0 1-.77-4.3c0-1.5.27-2.96.77-4.3l-7.9-6.13C2.34 16.08 1 20.17 1 24c0 3.83 1.34 7.92 3.98 10.43l7.9-6.13z" />
                <path fill="#EA4335" d="M24 47c6.64 0 12.25-2.18 16.34-5.91l-7.15-5.56c-2.2 1.48-5.01 2.37-9.19 2.37-5.8 0-10.85-3.75-12.95-8.76l-7.9 6.13C7.14 42.64 14.85 47 24 47z" />
              </svg>
              Sign in with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
