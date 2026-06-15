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
const roleRoutes = {
  admin: ["/admin"],
  teacher: ["/teacher"],
  learner: ["/learner"],
};
const homeByRole = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  learner: "/learner/dashboard",
};

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
  const role = request.cookies.get("role")?.value;
  const isLoggedIn = Boolean(token);

  if (matches(pathname, guestRoutes)) {
    return isLoggedIn
      ? redirect(request, homeByRole[role] || "/")
      : NextResponse.next();
  }

  if (matches(pathname, publicRoutes)) {
    return NextResponse.next();
  }

  const requiredRole = Object.entries(roleRoutes).find(([, routes]) =>
    matches(pathname, routes)
  )?.[0];
  const needsLogin = requiredRole || matches(pathname, protectedRoutes);

  if (needsLogin && !isLoggedIn) {
    return redirectToLogin(request);
  }

  if (requiredRole && role !== requiredRole) {
    return redirect(request, "/403");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
