import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "./db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      id: "demo-login",
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@voxora.ai" },
        name: { label: "Name", type: "text", placeholder: "Alex Vance" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim() || "creator@voxora.ai";
        const name = credentials?.name?.trim() || "Alex Vance";

        // Find or create user in Prisma database
        let user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await db.user.create({
            data: {
              email,
              name,
              image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
              lastLogin: new Date(),
              preferences: JSON.stringify({
                defaultSourceLanguage: "auto",
                defaultTargetLanguage: "en",
                defaultVoice: "natural-female",
                playbackSpeed: 1.0,
              }),
            },
          });
        } else {
          await db.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          if (!user.email) return false;

          let dbUser = await db.user.findUnique({
            where: { email: user.email },
          });

          if (!dbUser) {
            dbUser = await db.user.create({
              data: {
                email: user.email,
                name: user.name || "Voxora User",
                image: user.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
                lastLogin: new Date(),
                preferences: JSON.stringify({
                  defaultSourceLanguage: "auto",
                  defaultTargetLanguage: "en",
                  defaultVoice: "natural-female",
                  playbackSpeed: 1.0,
                }),
              },
            });
          } else {
            await db.user.update({
              where: { id: dbUser.id },
              data: {
                name: user.name || dbUser.name,
                image: user.image || dbUser.image,
                lastLogin: new Date(),
              },
            });
          }

          // Link Google account if not linked
          const existingAccount = await db.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });

          if (!existingAccount) {
            await db.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | undefined,
              },
            });
          }

          user.id = dbUser.id;
          return true;
        } catch (error) {
          console.error("Error during Google OAuth sign in:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "voxora-ai-ultra-secure-nextauth-secret-key-32charsmin",
};
