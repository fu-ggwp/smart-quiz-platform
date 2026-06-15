import { AppSidebar } from "@/components/layout/app-sidebar";

export default function TeacherLayout({ children }) {
  return (
    <main className="bg-background text-foreground md:flex md:h-screen md:overflow-hidden">
      <AppSidebar role="teacher" />
      <section className="min-w-0 flex-1 overflow-y-auto">{children}</section>
    </main>
  );
}
