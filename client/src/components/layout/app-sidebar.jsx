"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Building2,
  CreditCard,
  GraduationCap,
  Home,
  LibraryBig,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

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
    homeHref: "/teacher/dashboard",
    icon: ShieldCheck,
    nav: [
      { label: "Dashboard", href: "/teacher/dashboard", icon: Home },
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
    homeHref: "/learner/dashboard",
    icon: GraduationCap,
    nav: [
      { label: "Dashboard", href: "/learner/dashboard", icon: Home },
      { label: "Study sets", href: "/learner/study-sets", icon: BookOpen },
      { label: "Classes", href: "/learner/classes", icon: Building2 },
      { label: "Exams", href: "/learner/exams", icon: GraduationCap },
      { label: "Progress", href: "/learner/progress", icon: BarChart3 },
    ],
  },
};

const secondaryNav = [
  { label: "Explore", href: "/search", icon: Search },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Plans", href: "/plans", icon: CreditCard },
];

function SidebarLink({ item, pathname }) {
  const Icon = item.icon;
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      <span>{item.label}</span>
    </Link>
  );
}

export function AppSidebar({ role, profile }) {
  const pathname = usePathname();
  const config = roleConfig[role] ?? roleConfig.learner;
  const RoleIcon = config.icon;
  const displayName =
    profile?.fullName || profile?.username || "Smart Quiz user";

  return (
    <aside className="w-full shrink-0 border-b border-border bg-background text-foreground md:h-screen md:w-72 md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="flex h-full flex-col gap-5 p-4">
        <Link
          href={config.homeHref}
          className="flex items-center gap-3 rounded-xl bg-muted p-3 text-foreground"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <RoleIcon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold">Smart Quiz</span>
            <span className="block truncate text-xs text-muted-foreground">
              {config.label}
            </span>
          </span>
        </Link>

        <nav className="grid gap-1">
          {config.nav.map((item) => (
            <SidebarLink item={item} key={item.href} pathname={pathname} />
          ))}
        </nav>

        <div className="mt-auto grid gap-1 border-t border-border pt-4">
          {secondaryNav.map((item) => (
            <SidebarLink item={item} key={item.href} pathname={pathname} />
          ))}
        </div>
      </div>
    </aside>
  );
}
