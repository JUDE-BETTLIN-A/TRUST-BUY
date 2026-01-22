import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.email === "user@demo.com" && credentials?.password === "password") {
          return {
            id: "1",
            name: "Demo User",
            email: "user@demo.com",
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",
          };
        }

        if (credentials?.email && credentials?.password) {
          const email = credentials.email as string;
          let displayName = credentials.name as string;

          if (!displayName) {
            const namePart = email.split('@')[0];
            displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          }

          return {
            id: email,
            name: displayName,
            email: email,
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "super-secret-demo-key",
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
});

export const { GET, POST } = handlers;

