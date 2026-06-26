"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Building2,
  GraduationCap,
  Home,
  LibraryBig,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  getSavedSidebarCollapsed,
  subscribeToSidebarCollapsed,
} from "@/components/layout/sidebar-state";

const roleConfig = {
  admin: {
    label: "Admin workspace",
    homeHref: "/admin/dashboard",
    icon: ShieldCheck,
    nav: [
      { label: "Dashboard", href: "/admin/dashboard", icon: Home },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Resources", href: "/admin/resources", icon: LibraryBig },
      { label: "System status", href: "/admin/system-status", icon: Settings },
    ],
  },
  teacher: {
    label: "Teacher workspace",
    homeHref: "/teacher",
    icon: ShieldCheck,
    nav: [
      { label: "Dashboard", href: "/teacher", icon: Home, exact: true },
      { label: "Study sets", href: "/teacher/study-sets", icon: BookOpen },
      {
        label: "Question banks",
        href: "/teacher/question-banks",
        icon: LibraryBig,
      },
      { label: "Classes", href: "/teacher/classes", icon: Building2 },
      { label: "Exams", href: "/teacher/exams", icon: GraduationCap },
      { label: "Analytics", href: "/teacher/analytics", icon: BarChart3 },
    ],
  },
  learner: {
    label: "Learner workspace",
    homeHref: "/learner",
    icon: GraduationCap,
    nav: [
      { label: "Dashboard", href: "/learner", icon: Home, exact: true },
      { label: "Study sets", href: "/learner/study-sets", icon: BookOpen },
      { label: "Classes", href: "/learner/classes", icon: Building2 },
      { label: "Exams", href: "/learner/exams", icon: GraduationCap },
      { label: "Progress", href: "/learner/progress", icon: BarChart3 },
    ],
  },
};

function SidebarLink({ isCollapsed, item, pathname }) {
  const Icon = item.icon;
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      title={isCollapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
        isCollapsed && "md:justify-center md:px-2",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      <span className={cn(isCollapsed && "md:sr-only")}>{item.label}</span>
    </Link>
  );
}

export function AppSidebar({ role }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(getSavedSidebarCollapsed);
  const config = roleConfig[role] ?? roleConfig.learner;

  useEffect(() => {
    return subscribeToSidebarCollapsed(setIsCollapsed);
  }, []);

  return (
    <aside
      className={cn(
        "w-full shrink-0 border-b border-border bg-background text-foreground transition-[width] duration-200 md:h-full md:overflow-y-auto md:border-b-0 md:border-r",
        isCollapsed ? "md:w-20" : "md:w-72",
      )}
    >
      <div className="flex h-full flex-col gap-5 p-4">
        <nav className="grid gap-1">
          {config.nav.map((item) => (
            <SidebarLink
              isCollapsed={isCollapsed}
              item={item}
              key={item.href}
              pathname={pathname}
            />
          ))}
        </nav>

        <div className="mt-auto" />
      </div>
    </aside>
  );
}
