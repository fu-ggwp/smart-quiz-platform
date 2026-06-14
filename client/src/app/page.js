import Link from "next/link";
import { BookOpen, GraduationCap, Search, ShieldCheck } from "lucide-react";

import { Navbar } from "@/components/layout/navbar";
import { PublicStudySets } from "@/components/public-study-sets";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="border-b border-border bg-auth-panel/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center gap-6">
            <div className="flex flex-col gap-4">
              <h1 className="max-w-4xl text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                Create, share, and practice smarter study sets.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                SQP helps learners discover public study sets, practice with
                flashcards, and helps teachers build question banks, classes,
                and exam sessions in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/register">Start learning</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/search">
                  <Search data-icon="inline-start" />
                  Browse public sets
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Study session
                </p>
                <h2 className="mt-1 text-xl font-bold text-foreground">
                  Biology flashcards
                </h2>
              </div>
              <span className="rounded-full bg-auth-action px-3 py-1 text-xs font-semibold text-auth-action-foreground">
                Public
              </span>
            </div>

            <div className="grid gap-3 py-5">
              {[
                ["Questions", "48"],
                ["Accuracy target", "85%"],
                ["Estimated time", "25 min"],
              ].map(([label, value]) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3"
                  key={label}
                >
                  <span className="text-sm font-semibold text-secondary-foreground">
                    {label}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Guest", BookOpen],
                ["Learner", GraduationCap],
                ["Teacher", ShieldCheck],
              ].map(([label, Icon]) => (
                <div
                  className="rounded-lg border border-border bg-background p-4 text-center"
                  key={label}
                >
                  <Icon className="mx-auto text-primary" />
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PublicStudySets limit={6} />
      </section>
    </main>
  );
}
