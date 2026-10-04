import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import DiscordProvider from "next-auth/providers/discord";
import GitHubProvider from "next-auth/providers/github";
import LinkedInProvider from "next-auth/providers/linkedin";
import TwitchProvider from "next-auth/providers/twitch";
import RedditProvider from "next-auth/providers/reddit";
import axios from "axios";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

/**
 * The Express backend, NOT this Next.js app.
 *
 * This callback used to call `${process.env.NEXTAUTH_URL}/api/users`, i.e. the
 * frontend's own origin. This app only serves /api/auth/[...nextauth] and
 * /api/contact, so that request 404'd, axios threw, the catch returned false
 * and NextAuth rejected the sign-in with AccessDenied — Google login failed for
 * every user. NEXTAUTH_URL stays the canonical external URL of *this* app; the
 * API lives at BACKEND_URL.
 */
const BACKEND_URL = (
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? ""
).replace(/\/+$/, "");

if (!BACKEND_URL) {
  console.error(
    "❌ Neither BACKEND_URL nor NEXT_PUBLIC_BASE_URL is set — the signIn callback cannot reach the API."
  );
}

const api = axios.create({ baseURL: BACKEND_URL, timeout: 10_000 });

type BackendUser = {
  _id: string;
  email: string;
  name?: string;
  image?: string;
  role?: string;
};

type BackendAuthResponse = {
  user: BackendUser;
  token: string;
};

/** Backend JWTs are minted with a 5h expiry — refresh a little before that. */
const TOKEN_TTL_MS = 5 * 60 * 60 * 1000;
const REFRESH_SKEW_MS = 10 * 60 * 1000;

/**
 * Registers (or updates) the user in the API and returns the backend identity
 * plus a fresh JWT. Returns null if the API is unreachable.
 */
async function syncUserWithBackend(profile: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}): Promise<{ user: BackendUser; token: string; expiresAt: number } | null> {
  if (!BACKEND_URL || !profile.email) return null;

  try {
    // validateStatus < 500 so a 404 ("user not found") is a normal branch.
    // It used to throw here, which is why brand-new accounts could never
    // reach the create call below.
    const existing = await api.get("/api/users", {
      params: { email: profile.email },
      validateStatus: (s) => s < 500,
    });

    const known = existing.data?.user as BackendUser | undefined;

    const created = await api.post<BackendAuthResponse>("/api/users", {
      name: profile.name ?? known?.name ?? "No Name",
      email: profile.email,
      image: profile.image ?? known?.image ?? "",
    });

    const user = created.data?.user;
    const token = created.data?.token;
    if (!user?._id || !token) {
      console.error("❌ Backend response was missing user._id or token");
      return null;
    }

    return { user, token, expiresAt: Date.now() + TOKEN_TTL_MS };
  } catch (error: any) {
    console.error("❌ Failed to sync user with the API:", error.message);
    return null;
  }
}

/** Only register providers that are actually configured, so a missing env var
 *  can't leave a login button that dies with a NextAuth "Configuration" error. */
const configured = (id?: string, secret?: string) => Boolean(id && secret);

const providers = [
  configured(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET) &&
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  configured(process.env.FACEBOOK_CLIENT_ID, process.env.FACEBOOK_CLIENT_SECRET) &&
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  configured(process.env.TWITTER_CLIENT_ID, process.env.TWITTER_CLIENT_SECRET) &&
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
  configured(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET) &&
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  configured(process.env.GITHUB_CLIENT_ID, process.env.GITHUB_CLIENT_SECRET) &&
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  configured(process.env.LINKEDIN_CLIENT_ID, process.env.LINKEDIN_CLIENT_SECRET) &&
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  configured(process.env.TWITCH_CLIENT_ID, process.env.TWITCH_CLIENT_SECRET) &&
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  configured(process.env.REDDIT_CLIENT_ID, process.env.REDDIT_CLIENT_SECRET) &&
    RedditProvider({
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    }),
].filter(Boolean) as NextAuthOptions["providers"];

const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }): Promise<boolean> {
      // Presence of an email from the provider is enough to allow the sign-in;
      // the API sync happens in the jwt callback where its result can actually
      // be persisted onto the token.
      if (!user.email) {
        console.warn("⚠️ Provider returned no email — denying sign-in");
        return false;
      }
      return true;
    },

    async jwt({ token, user }): Promise<JWT> {
      // First sign-in: create/refresh the API user and store the backend JWT.
      if (user && !token.id) {
        const synced = await syncUserWithBackend(user);
        if (synced) {
          token.id = synced.user._id;
          token.token = synced.token;
          token.role = synced.user.role;
          token.expiresAt = synced.expiresAt;
        }
        return token;
      }

      // Later requests: refresh the backend JWT before it expires, otherwise
      // commenting and the admin panel start 401-ing five hours after login.
      const expiresAt = (token as any).expiresAt as number | undefined;
      if (token.token && expiresAt && Date.now() > expiresAt - REFRESH_SKEW_MS && token.email) {
        const synced = await syncUserWithBackend({
          name: token.name,
          email: token.email,
          image: token.picture,
        });
        if (synced) {
          token.id = synced.user._id;
          token.token = synced.token;
          token.role = synced.user.role;
          token.expiresAt = synced.expiresAt;
        }
      }

      return token;
    },

    async session({ session, token }): Promise<Session> {
      if (session.user) {
        session.user.id = token.id;
        session.user.token = token.token;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
};


export { authOptions };
