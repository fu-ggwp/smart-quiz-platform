import { PublicSearchResults } from "@/components/public/public-search-results";

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const initialQuery = typeof params?.q === "string" ? params.q.trim() : "";

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="border-b border-border pb-6">
          <h1 className="mt-1 text-3xl font-bold text-foreground">
            Search public content
          </h1>
        </div>

        <PublicSearchResults key={initialQuery} initialQuery={initialQuery} />
      </section>
    </div>
  );
}
