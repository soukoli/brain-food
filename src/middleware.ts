import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { NextResponse } from "next/server";

// Use edge-compatible auth config (no database adapter)
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;

  // Public routes that don't require auth
  const publicRoutes = ["/login", "/api/auth"];
  const isPublicRoute = publicRoutes.some((route) => nextUrl.pathname.startsWith(route));

  // Static assets and manifest
  const isStaticAsset =
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.includes(".") ||
    nextUrl.pathname === "/manifest.json";

  if (isStaticAsset) {
    return NextResponse.next();
  }

  // API routes need auth (except auth endpoints)
  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isAuthApi = nextUrl.pathname.startsWith("/api/auth");

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login
  if (isLoggedIn && nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Block API access for unauthenticated users (except auth endpoints)
  if (isApiRoute && !isAuthApi && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)"],
};
