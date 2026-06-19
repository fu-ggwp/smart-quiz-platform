"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  authService,
  cleanOAuthHash,
  clearAuthCookie,
  getCurrentProfile,
  getCurrentSession,
  getPostLoginRedirect,
  syncAuthCookie,
} from "@/services/auth.service";

function getCallbackNextPath() {
  if (typeof window === "undefined") return null;

  return new URLSearchParams(window.location.search).get("next");
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    let active = true;

    async function completeAuth() {
      try {
        const session = await getCurrentSession();

        if (!session) {
          throw new Error("Could not complete sign in.");
        }

        syncAuthCookie(session);
        const profile = await getCurrentProfile();
        const destination = getPostLoginRedirect(profile, getCallbackNextPath());

        cleanOAuthHash();
        router.replace(destination);
        router.refresh();
      } catch (error) {
        await authService.logout().catch(() => clearAuthCookie());
        cleanOAuthHash();

        if (active) {
          setMessage(error.message || "Could not complete sign in.");
        }

        router.replace("/login");
      }
    }

    completeAuth();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}
