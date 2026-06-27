import { PublicStudySets } from "@/components/public/public-study-sets";

export default function PublicStudySetsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="border-b border-border pb-6">
          <p className="text-sm font-semibold text-primary">Study sets</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">
            Public study sets
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Browse learning materials that are open to guests.
          </p>
        </div>

        <PublicStudySets showSearch />
      </section>
    </main>
  );
}
