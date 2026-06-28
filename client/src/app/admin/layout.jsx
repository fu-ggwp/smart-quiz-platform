import { AppSidebar } from "@/components/layout/app-sidebar";
import { RoleGuard } from "@/components/layout/role-guard";

export default function AdminLayout({ children }) {
  return (
    <RoleGuard allowedRole="admin">
      <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground md:flex-row">
        <AppSidebar role="admin" />
        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          {children}
        </section>
      </main>
    </RoleGuard>
  );
}
