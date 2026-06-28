import { PublicUserDetail } from "@/components/public/public-user-detail";

export default async function PublicProfilePage({ params }) {
  const resolvedParams = await params;
  const username = resolvedParams?.username ?? "";

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-8">
        <PublicUserDetail username={username} />
      </section>
    </main>
  );
}
