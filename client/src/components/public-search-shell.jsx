"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

const SIDEBAR_ROLES = new Set(["admin", "learner", "teacher"]);
const LAST_ROLE_KEY = "smart_quiz_last_role";

function getSavedRole() {
  if (typeof window === "undefined") return null;

  const savedRole = window.localStorage.getItem(LAST_ROLE_KEY);
  return SIDEBAR_ROLES.has(savedRole) ? savedRole : null;
}

export function PublicSearchShell({ children }) {
  const { isAuthenticated, loading, role } = useAuth();
  const [savedRole] = useState(getSavedRole);
  const sidebarRole = SIDEBAR_ROLES.has(role) ? role : savedRole;
  const shouldShowSidebar = Boolean(sidebarRole) && (loading || isAuthenticated);

  useEffect(() => {
    if (!SIDEBAR_ROLES.has(role)) return;

    window.localStorage.setItem(LAST_ROLE_KEY, role);
  }, [role]);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <div className="flex-1 md:flex">
        {shouldShowSidebar ? <AppSidebar role={sidebarRole} /> : null}
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}
