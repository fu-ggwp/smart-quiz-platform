import { AppSidebar } from "@/components/layout/app-sidebar";
import { Navbar } from "@/components/layout/navbar";
import { RoleGuard } from "@/components/layout/role-guard";

export default function LearnerLayout({ children }) {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <div className="flex-1 md:flex">
        <AppSidebar role="learner" />
        <section className="min-w-0 flex-1">
          <RoleGuard allowedRole="learner">{children}</RoleGuard>
        </section>
      </div>
    </main>
  );
}
