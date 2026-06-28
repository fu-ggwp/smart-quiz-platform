"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BookOpen, Search, Sparkles, Users } from "lucide-react";

import { PublicStudySets } from "@/components/public/public-study-sets";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const ROLE_HOME = {
  admin: "/admin/dashboard",
  teacher: "/teacher",
  learner: "/learner",
};

export default function HomeRedirectPage() {
  const router = useRouter();
  const { loading, role } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (ROLE_HOME[role]) {
      router.replace(ROLE_HOME[role]);
    }
  }, [loading, role, router]);

  if (loading || ROLE_HOME[role]) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <p className="text-sm font-medium text-muted-foreground">
          Redirecting to dashboard...
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-12">
        <div className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary">CardIO</p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal text-foreground sm:text-5xl">
              Discover study sets and practice smarter
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Browse public learning materials, search active public users, and
              preview study sets before creating an account.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/search">
                  <Search data-icon="inline-start" />
                  Search content
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/study-sets">
                  <BookOpen data-icon="inline-start" />
                  Study sets
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <FeatureCard
              description="Find public study materials by keyword, topic, or teacher."
              icon={<Search />}
              title="Search"
            />
            <FeatureCard
              description="Open shared sets and try flashcards as a guest."
              icon={<Sparkles />}
              title="Practice"
            />
            <FeatureCard
              description="Explore public profiles from active learners and teachers."
              icon={<Users />}
              title="People"
            />
          </div>
        </div>

        <PublicStudySets limit={6} />
      </section>
    </div>
  );
}

function FeatureCard({ description, icon, title }) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        {icon}
      </div>
      <h2 className="mt-4 text-base font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}
