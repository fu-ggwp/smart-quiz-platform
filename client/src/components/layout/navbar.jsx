"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Search, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toggleSavedSidebarCollapsed } from "@/components/layout/sidebar-state";
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
  const [searchInput, setSearchInput] = useState("");
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

  function handleSearchSubmit(event) {
    event.preventDefault();

    const keyword = searchInput.trim();
    const href = keyword ? `/search?q=${encodeURIComponent(keyword)}` : "/search";

    router.push(href);
  }

  return (
    <header className="shrink-0 border-b border-border bg-background/95">
      <div className="relative flex w-full flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-2">
          {!loading && isAuthenticated ? (
            <Button
              aria-label="Toggle sidebar"
              className="lg:-ml-2"
              onClick={toggleSavedSidebarCollapsed}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Menu />
            </Button>
          ) : null}
          <Link href="/" className="text-lg font-bold text-foreground">
            Smart Quiz Platform
          </Link>
        </div>

        <form
          className="flex h-9 w-full items-center rounded-2xl border border-transparent bg-input/50 pl-4 pr-1 transition-[color,box-shadow] duration-200 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30 lg:absolute lg:left-1/2 lg:max-w-xl lg:-translate-x-1/2"
          onSubmit={handleSearchSubmit}
        >
          <Input
            aria-label="Search study sets"
            className="h-8 flex-1 border-0 bg-transparent px-0 py-0 focus-visible:ring-0"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search study sets"
            value={searchInput}
          />
          <Button aria-label="Search" size="icon" type="submit" variant="ghost">
            <Search />
          </Button>
        </form>

        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground lg:justify-end">
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
