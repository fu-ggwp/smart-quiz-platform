import { AppSidebar } from "@/components/layout/app-sidebar";

export default function LearnerLayout({ children }) {
  return (
    <main className="bg-background text-foreground md:flex md:h-screen md:overflow-hidden">
      <AppSidebar role="learner" />
      <section className="min-w-0 flex-1 overflow-y-auto">{children}</section>
    </main>
  );
}
