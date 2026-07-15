"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Repeat2, Search, User } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toggleSavedSidebarCollapsed } from "@/components/layout/sidebar-state";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { useAuth } from "@/hooks/use-auth";
import { SWITCHABLE_ROLE_HOME } from "@/lib/auth-constants";
import { authService } from "@/services/auth.service";
import { profileService } from "@/services/profile.service";

export function Navbar() {
  const router = useRouter();
  const {
    clearAuthState,
    isAuthenticated,
    loading,
    profile,
    role,
    setProfile,
  } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const targetRole =
    role === "learner" ? "teacher" : role === "teacher" ? "learner" : null;
  const canViewNotifications = isAuthenticated && role !== "admin";
  const displayName = profile?.fullName || profile?.username || "User";
  const avatarUrl = profile?.avatarUrl || profile?.avatar_url || "";
  const initial = displayName.charAt(0).toUpperCase();

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout failed after clearing local auth", error);
    } finally {
      clearAuthState();
      setIsLoggingOut(false);

      window.location.replace("/login");
    }
  }

  async function handleSwitchRole() {
    if (!targetRole) return;

    setIsSwitchingRole(true);

    try {
      const profile = await profileService.switchRole(targetRole);
      setProfile(profile);
      router.replace(SWITCHABLE_ROLE_HOME[targetRole]);
    } catch (error) {
      console.error("Role switch failed", error);
    } finally {
      setIsSwitchingRole(false);
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    const keyword = searchInput.trim();
    const href = keyword
      ? `/search?q=${encodeURIComponent(keyword)}`
      : "/search";

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
            CardIO
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
            placeholder="Search public study sets and users"
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

          {isAuthenticated ? (
            <>
              {canViewNotifications ? <NotificationCenter /> : null}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label="Open user menu"
                    className="rounded-full"
                    disabled={isLoggingOut || isSwitchingRole}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Avatar>
                      {avatarUrl ? (
                        <AvatarImage alt={displayName} src={avatarUrl} />
                      ) : null}
                      <AvatarFallback className="font-bold">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {targetRole ? (
                      <DropdownMenuItem
                        disabled={isSwitchingRole || isLoggingOut}
                        onSelect={(event) => {
                          event.preventDefault();
                          handleSwitchRole();
                        }}
                      >
                        <Repeat2 />
                        {isSwitchingRole
                          ? "Switching..."
                          : `Switch to ${targetRole === "teacher" ? "Teacher" : "Learner"}`}
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={isLoggingOut}
                    onSelect={(event) => {
                      event.preventDefault();
                      handleLogout();
                    }}
                    variant="destructive"
                  >
                    <LogOut />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}

          {!isAuthenticated ? (
            <>
              <Button asChild variant="secondary">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
