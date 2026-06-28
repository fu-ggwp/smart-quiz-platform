"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";

const ROLE_HOME = {
  admin: "/admin/dashboard",
  teacher: "/teacher",
  learner: "/learner",
};

function getLoginPath(pathname) {
  const next = encodeURIComponent(pathname || "/");
  return `/login?next=${next}`;
}

function getRoleMismatchRedirect(role) {
  return ROLE_HOME[role] || "/403";
}

export function RoleGuard({ allowedRole, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading, profileVerified, role } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace(getLoginPath(pathname));
      return;
    }

    if (!profileVerified) return;

    if (role && role !== allowedRole) {
      router.replace(getRoleMismatchRedirect(role));
    }
  }, [allowedRole, isAuthenticated, loading, pathname, profileVerified, role, router]);

  if (loading || !isAuthenticated || !profileVerified || role !== allowedRole) {
    return (
      <section className="flex min-h-full items-center justify-center px-6 py-12">
        <p className="text-sm font-medium text-muted-foreground">Loading workspace...</p>
      </section>
    );
  }

  return children;
}
