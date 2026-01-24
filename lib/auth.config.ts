import type { NextAuthConfig } from "next-auth";

export const authConfig = {
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
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const protectedRoutes = ["/budget", "/alerts", "/analysis", "/seller"];
            const isOnProtected = protectedRoutes.some((route) =>
                nextUrl.pathname.startsWith(route)
            );
            const isOnAuth = nextUrl.pathname.startsWith("/auth/signin");

            if (isOnProtected) {
                if (isLoggedIn) return true;
                return false; // Redirects to sign-in page
            }

            if (isOnAuth && isLoggedIn) {
                return Response.redirect(new URL("/home", nextUrl));
            }

            return true;
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig;
