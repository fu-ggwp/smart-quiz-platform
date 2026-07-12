"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Brain,
  CirclePlay,
  ClipboardCheck,
  AlertCircle,
  BookOpen,
  Layers,
  Search,
  Trophy,
} from "lucide-react";

import { StudySetCard } from "@/components/study-set/study-set-card";
import { usePublicStudySets } from "@/hooks/use-public-study-sets";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_HOME } from "@/lib/auth-constants";

const modes = [
  {
    title: "Learn",
    text: "Build a topic with short practice rounds and instant feedback.",
    icon: Brain,
    tone: "bg-success/10 text-success",
  },
  {
    title: "Flashcards",
    text: "Flip terms, definitions, and examples from public study sets.",
    icon: Layers,
    tone: "bg-info/10 text-info",
  },
  {
    title: "Test",
    text: "Try multiple-choice, true/false, and written questions.",
    icon: ClipboardCheck,
    tone: "bg-warning/10 text-warning",
  },
  {
    title: "Review",
    text: "Open weak topics and compare answers before signing up.",
    icon: Trophy,
    tone: "bg-error/10 text-error",
  },
];

export default function HomeRedirectPage() {
  const router = useRouter();
  const { loading, role } = useAuth();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (loading) return;

    if (ROLE_HOME[role]) {
      router.replace(ROLE_HOME[role]);
    }
  }, [loading, role, router]);

  function submitSearch(event) {
    event.preventDefault();

    const keyword = query.trim();
    router.push(keyword ? `/search?q=${encodeURIComponent(keyword)}` : "/search");
  }

  if (ROLE_HOME[role]) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <p className="text-sm font-medium text-muted-foreground">
          Redirecting to dashboard...
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-full bg-background text-foreground">
      <section className="mx-auto flex max-w-[1240px] flex-col items-center px-6 pb-28 pt-24 text-center sm:pt-28">
        <h1 className="max-w-5xl text-4xl font-extrabold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
          How do you want to study?
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Search public study sets, preview flashcards, and practice sample
          questions before creating an account.
        </p>

        <form
          className="mt-9 flex w-full max-w-3xl items-center gap-3 rounded-lg border border-border bg-card p-2 shadow-sm"
          onSubmit={submitSearch}
        >
          <Search className="ml-3 size-5 shrink-0 text-muted-foreground" />
          <input
            aria-label="Search public study sets"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search biology, chemistry, math, flashcards"
            value={query}
          />
          <button
            className="h-12 rounded-lg bg-primary px-7 text-sm font-bold text-primary-foreground transition hover:bg-primary/80"
            type="submit"
          >
            Search
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/80"
            href="/register"
          >
            Sign up for free
          </Link>
          <Link
            className="rounded-lg border border-border bg-card px-6 py-3 text-sm font-bold text-foreground transition hover:bg-muted"
            href="/search"
          >
            Browse study sets
          </Link>
        </div>
      </section>

      <main className="mx-auto max-w-[1240px] px-6 pb-14">
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-normal">
                Choose a study mode
              </h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Explore modes without signing in. History and class work start
                after login.
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-sm font-extrabold text-success"
              href="/register"
            >
              Create free account <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {modes.map((mode) => (
              <ModeCard key={mode.title} {...mode} />
            ))}
          </div>
        </section>

        <section className="grid gap-8 py-16 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-extrabold text-success">
              Public learning library
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-normal">
              Find sets for any class or exam topic
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Start from public cards by subject, topic, teacher, or keyword.
              Open a set, preview questions, then decide whether to sign in.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoBox label="Subjects" value="Biology, Chemistry, Math" />
              <InfoBox
                label="Question formats"
                value="Multiple choice, true/false, written"
              />
              <InfoBox label="Public access" value="Search, preview, flashcards" />
              <InfoBox label="Account access" value="Classes, exams, saved history" />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="relative h-72">
              <Image
                alt="Student previewing flashcards on a laptop"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 580px, 100vw"
                src="/landing-study-card.png"
              />
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="rounded-lg bg-background p-5">
                <p className="text-xs font-extrabold uppercase text-muted-foreground/70">
                  Term
                </p>
                <p className="mt-3 text-lg font-extrabold">
                  Selective permeability
                </p>
              </div>
              <div className="rounded-lg bg-success/10 p-5">
                <p className="text-xs font-extrabold uppercase text-success">
                  Definition
                </p>
                <p className="mt-3 text-base font-extrabold leading-6 text-success">
                  Membrane allows some substances through and controls others.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 pb-16 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-extrabold text-warning">
                Sample practice
              </span>
              <span className="text-sm font-extrabold text-muted-foreground">
                3 questions
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <QuestionPreview
                label="Question 1"
                text="Which organelle is primarily responsible for ATP production in eukaryotic cells?"
              />
              <QuestionPreview
                label="Question 2"
                text="Passive transport requires ATP to move substances across a membrane."
              />
              <QuestionPreview
                label="Question 3"
                text="Explain why the cell membrane is described as selectively permeable."
              />
            </div>
            <Link
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/80"
              href="/login"
            >
              <CirclePlay className="size-4" />
              Try sample set
            </Link>
          </div>

          <div>
            <span className="inline-flex rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-extrabold text-warning">
              Study your way
            </span>
            <h2 className="mt-5 max-w-xl text-3xl font-extrabold leading-tight tracking-normal sm:text-4xl">
              Preview cards, then switch to practice when ready
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              Start as a guest, then sign in later if you want saved history,
              classes, and exams.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-extrabold text-foreground transition hover:bg-muted"
                href="/search"
              >
                Open flashcards
              </Link>
              <Link
                className="px-5 py-3 text-sm font-extrabold text-foreground transition hover:text-black"
                href="/login"
              >
                Login to save history
              </Link>
            </div>
          </div>
        </section>

        <section>
          <LandingStudySets />
        </section>
      </main>

      <Footer />
    </div>
  );
}

function ModeCard({ icon: Icon, text, title, tone }) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className={`flex size-12 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="size-6" />
      </div>
      <h3 className="mt-6 text-lg font-extrabold">{title}</h3>
      <p className="mt-3 min-h-12 text-sm font-medium leading-6 text-muted-foreground">
        {text}
      </p>
      <Link
        className="mt-5 inline-flex items-center gap-1 text-sm font-extrabold text-success"
        href="/login"
      >
        Open <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-extrabold uppercase text-muted-foreground/70">{label}</p>
      <p className="mt-2 text-sm font-extrabold text-foreground">{value}</p>
    </div>
  );
}

function QuestionPreview({ label, text }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-extrabold uppercase text-muted-foreground/70">{label}</p>
      <p className="mt-2 text-sm font-extrabold leading-5 text-foreground">
        {text}
      </p>
    </div>
  );
}

function Footer() {
  const groups = [
    ["Study", "Flashcards", "Practice tests", "Public sets"],
    ["Subjects", "Biology", "Chemistry", "Mathematics"],
    ["Account", "Login", "Register", "Premium"],
    ["Platform", "Teachers", "Resources", "Help"],
  ];

  return (
    <footer className="mx-auto grid max-w-[1240px] gap-8 border-t border-border px-6 py-9 sm:grid-cols-2 lg:grid-cols-4">
      {groups.map(([title, ...items]) => (
        <div key={title}>
          <h2 className="text-base font-extrabold">{title}</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <Link
                className="block text-sm font-extrabold text-muted-foreground transition hover:text-foreground"
                href={getFooterHref(item)}
                key={item}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </footer>
  );
}

function getFooterHref(item) {
  if (item === "Login") return "/login";
  if (item === "Register") return "/register";
  if (item === "Public sets") return "/search";
  if (["Biology", "Chemistry", "Mathematics"].includes(item)) {
    return `/search?q=${encodeURIComponent(item)}`;
  }
  return "/login";
}

function LandingStudySets() {
  const { error, loading, studySets } = usePublicStudySets();
  const visibleStudySets = studySets.slice(0, 3);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-normal">
          Popular study sets
        </h2>
        <Link
          className="inline-flex items-center gap-1 text-sm font-extrabold text-success"
          href="/search"
        >
          View all <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-5">
        {loading ? (
          <LandingStatePanel title="Loading public study sets" />
        ) : error ? (
          <LandingStatePanel
            icon={<AlertCircle />}
            title="Unable to load public study sets"
            description="Please check the connection and try again."
          />
        ) : visibleStudySets.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {visibleStudySets.map((studySet) => (
              <StudySetCard
                key={studySet.study_set_id ?? studySet.id}
                studySet={studySet}
              />
            ))}
          </div>
        ) : (
          <LandingStatePanel
            icon={<BookOpen />}
            title="No public study sets found"
            description="Create public study sets first, then they will appear here."
          />
        )}
      </div>
    </div>
  );
}

function LandingStatePanel({ description, icon, title }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      {icon ? (
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-extrabold text-foreground">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
