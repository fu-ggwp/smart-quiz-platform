"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { authService } from "@/services/auth.service";
import { profileService } from "@/services/profile.service";

const ROLE_HOME = {
  teacher: "/teacher",
  learner: "/learner",
};

export function Navbar() {
  const router = useRouter();
  const { isAuthenticated, loading, role, refreshProfile } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const targetRole =
    role === "learner" ? "teacher" : role === "teacher" ? "learner" : null;

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout failed after clearing local auth", error);
    } finally {
      router.replace("/login");
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  async function handleSwitchRole() {
    if (!targetRole) return;

    setIsSwitchingRole(true);

    try {
      await profileService.switchRole(targetRole);
      await refreshProfile();
      router.replace(ROLE_HOME[targetRole]);
      router.refresh();
    } catch (error) {
      console.error("Role switch failed", error);
    } finally {
      setIsSwitchingRole(false);
    }
  }

  return (
    <header className="shrink-0 border-b border-border bg-background/95">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold text-foreground">
          Smart Quiz Platform
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Button asChild variant="ghost">
            <Link href="/search">Explore</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/plans">Plans</Link>
          </Button>

          {!loading && isAuthenticated ? (
            <>
              {targetRole ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSwitchRole}
                  disabled={isSwitchingRole || isLoggingOut}
                >
                  {isSwitchingRole
                    ? "Switching..."
                    : `Switch to ${targetRole === "teacher" ? "Teacher" : "Learner"}`}
                </Button>
              ) : null}
              <Button asChild variant="ghost">
                <Link href="/profile">
                  <User data-icon="inline-start" />
                  Profile
                </Link>
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut data-icon="inline-start" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </>
          ) : null}

          {!loading && !isAuthenticated ? (
            <>
              <Button asChild variant="secondary">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
