"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { completeLogout } from "@/services/auth.service";

export function Navbar() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState(() => {
    if (typeof window === "undefined") return "";

    return new URLSearchParams(window.location.search).get("logout") ===
      "success"
      ? "Logged out successfully."
      : "";
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("logout") !== "success") return;

    params.delete("logout");

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await completeLogout();
    } catch (error) {
      console.error("Logout failed after clearing local auth", error);
    } finally {
      router.replace("/login");
      router.refresh();
      setIsLoggingOut(false);
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

        {logoutMessage ? (
          <p className="w-full text-sm font-medium text-primary" role="status">
            {logoutMessage}
          </p>
        ) : null}
      </div>
    </header>
  );
}
