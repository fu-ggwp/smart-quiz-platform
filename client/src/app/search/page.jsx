import { PublicSearchResults } from "@/components/public-search-results";
import { Navbar } from "@/components/layout/navbar";

export default function SearchPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="border-b border-border pb-6">
            <p className="text-sm font-semibold text-primary">Explore</p>
            <h1 className="mt-1 text-3xl font-bold text-foreground">
              Search public content
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Find public study materials and active public user accounts by keyword.
            </p>
          </div>

          <PublicSearchResults />
        </section>
      </main>
    </>
  );
}
