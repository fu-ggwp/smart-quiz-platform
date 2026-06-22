"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/hooks/use-auth";

export default function ProfileLayout({ children }) {
  const { role } = useAuth();

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Navbar />
      <div className="min-h-0 flex-1 overflow-hidden md:flex">
        <AppSidebar role={role || "learner"} />
        <section className="min-w-0 flex-1 overflow-y-auto">{children}</section>
      </div>
    </main>
  );
}
