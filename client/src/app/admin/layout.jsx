import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AdminLayout({ children }) {
  return (
    <main className="min-h-screen bg-background text-foreground md:flex">
      <AppSidebar role="admin" />
      <section className="min-w-0 flex-1">{children}</section>
    </main>
  );
}
