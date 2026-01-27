import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const session = req.auth;
  const path = req.nextUrl.pathname;

  // Skip API routes entirely - let them handle their own auth
  if (path.startsWith("/api/")) {
    return NextResponse.next();
  }

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
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
