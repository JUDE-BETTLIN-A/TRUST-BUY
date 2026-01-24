import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const session = req.auth;
  const path = req.nextUrl.pathname;

  // Protect specific routes
  const protectedRoutes = ["/budget", "/alerts", "/analysis", "/seller"];

  if (protectedRoutes.some(route => path.startsWith(route)) && !session) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Prevent access to sign-in page if already logged in
  if (path.startsWith("/auth/signin") && session) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/budget/:path*", "/alerts/:path*", "/analysis/:path*", "/seller/:path*", "/auth/signin"],
};
