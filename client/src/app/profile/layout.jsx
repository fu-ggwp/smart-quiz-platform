"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/hooks/use-auth";

export default function ProfileLayout({ children }) {
  const { role } = useAuth();

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <div className="flex-1 md:flex">
        <AppSidebar role={role || "learner"} />
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}
