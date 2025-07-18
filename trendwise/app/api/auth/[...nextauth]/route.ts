import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import DiscordProvider from "next-auth/providers/discord";
import GitHubProvider from "next-auth/providers/github";
import LinkedInProvider from "next-auth/providers/linkedin";
import TwitchProvider from "next-auth/providers/twitch";
import RedditProvider from "next-auth/providers/reddit";
import axios from "axios";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
    RedditProvider({
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }: { user: User }) {
      try {
        const res = await axios.get(`${process.env.NEXTAUTH_URL}/api/users`, {
          params: { email: user.email },
        });

        if (res.data && res.data.user) {
          return true;
        }

        await axios.post(`${process.env.NEXTAUTH_URL}/api/users`, {
          name: user.name,
          email: user.email,
          image: user.image,
        });

        return true;
      } catch (error: any) {
        console.error("❌ signIn callback error:", error.message);
        return false;
      }
    },
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  debug: true,
} satisfies NextAuthOptions);

export { handler as GET, handler as POST };
