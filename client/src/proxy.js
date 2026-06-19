import { NextResponse } from "next/server";

const guestRoutes = ["/login", "/register"];
const publicRoutes = [
  "/",
  "/403",
  "/auth/callback",
  "/forgot-password",
  "/reset-password",
  "/plans",
  "/search",
  "/study-sets",
];
const protectedRoutes = [
  "/profile",
  "/upgrade",
  "/users",
];
const workspaceRoutes = ["/admin", "/teacher", "/learner"];

function matches(pathname, routes) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function redirect(request, pathname) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

function redirectToLogin(request) {
  const loginUrl = new URL("/login", request.url);
  const currentPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  loginUrl.searchParams.set("next", currentPath);
  return NextResponse.redirect(loginUrl);
}

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const isLoggedIn = Boolean(token);

  if (matches(pathname, guestRoutes)) {
    return isLoggedIn ? redirect(request, "/") : NextResponse.next();
  }

  if (matches(pathname, publicRoutes)) {
    return NextResponse.next();
  }

  const needsLogin =
    matches(pathname, protectedRoutes) || matches(pathname, workspaceRoutes);

  if (needsLogin && !isLoggedIn) {
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
