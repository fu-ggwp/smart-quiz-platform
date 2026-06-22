"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";

function getLoginPath(pathname) {
  const next = encodeURIComponent(pathname || "/");
  return `/login?next=${next}`;
}

export function RoleGuard({ allowedRole, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading, role } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace(getLoginPath(pathname));
      return;
    }

    if (role && role !== allowedRole) {
      router.replace("/403");
    }
  }, [allowedRole, isAuthenticated, loading, pathname, role, router]);

  if (loading || !isAuthenticated || role !== allowedRole) {
    return (
      <section className="flex min-h-full items-center justify-center px-6 py-12">
        <p className="text-sm font-medium text-muted-foreground">Loading workspace...</p>
      </section>
    );
  }

  return children;
}
