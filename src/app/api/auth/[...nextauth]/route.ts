import NextAuth, { NextAuthOptions } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    FacebookProvider({
      clientId: (process.env.FACEBOOK_CLIENT_ID || "").trim(),
      clientSecret: (process.env.FACEBOOK_CLIENT_SECRET || "").trim(),
      // Explicitly request email & public profile to avoid missing email issues
      authorization: {
        params: {
          scope: "email,public_profile",
        },
      },
    }),
    GoogleProvider({
      clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],

  secret: (process.env.NEXTAUTH_SECRET || "beautyglowry-auth-secret-key-123456").trim(),

  callbacks: {
    async signIn({ account, profile }) {
      // Block sign-in if provider credentials are not configured
      if (account?.provider === 'facebook') {
        const clientId = (process.env.FACEBOOK_CLIENT_ID || "").trim();
        if (!clientId) return false;
      }
      if (account?.provider === 'google') {
        const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
        if (!clientId) return false;
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }
      // Ensure email is captured from profile if not on token
      if (profile && !token.email) {
        token.email = (profile as any).email || null;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).provider = token.provider;
      (session as any).providerAccountId = token.providerAccountId;
      return session;
    },
  },

  pages: {
    signIn: "/",
    error: "/",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

