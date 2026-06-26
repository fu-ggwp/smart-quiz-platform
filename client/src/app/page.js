"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";

const ROLE_HOME = {
  admin: "/admin/dashboard",
  teacher: "/teacher",
  learner: "/learner",
};

export default function HomeRedirectPage() {
  const router = useRouter();
  const { loading, role } = useAuth();

  useEffect(() => {
    if (loading) return;

    router.replace(ROLE_HOME[role] ?? "/learner");
  }, [loading, role, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <p className="text-sm font-medium text-muted-foreground">Redirecting to dashboard...</p>
    </main>
  );
}
