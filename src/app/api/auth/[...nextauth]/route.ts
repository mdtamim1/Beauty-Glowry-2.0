import NextAuth from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    FacebookProvider({
      clientId: (process.env.FACEBOOK_CLIENT_ID || "").trim(),
      clientSecret: (process.env.FACEBOOK_CLIENT_SECRET || "").trim(),
    }),
    GoogleProvider({
      clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
    }),
  ],

  secret: (process.env.NEXTAUTH_SECRET || "beautyglowry-auth-secret-key-123456").trim(),
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).provider = token.provider;
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
});

export { handler as GET, handler as POST };
