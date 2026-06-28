import { AppSidebar } from "@/components/layout/app-sidebar";
import { Navbar } from "@/components/layout/navbar";
import { RoleGuard } from "@/components/layout/role-guard";

export default function LearnerLayout({ children }) {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Navbar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <AppSidebar role="learner" />
        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <RoleGuard allowedRole="learner">{children}</RoleGuard>
        </section>
      </div>
    </main>
  );
}
