import { Container } from "@/components/layout/container";

/**
 * Without this, /members would fall back to the (public) group skeleton, which is
 * hero-shaped and flashes a 26rem block this page never renders.
 */
export default function MembersLoading() {
  return (
    <div className="animate-pulse">
      {/* PageHeader */}
      <div className="bg-card">
        <Container className="py-14 sm:py-16">
          <div className="h-11 w-72 max-w-full rounded-lg bg-muted/60" />
          <div className="mt-4 h-0.5 w-16 bg-muted/60" />
          <div className="mt-4 h-5 w-96 max-w-full rounded bg-muted/60" />
        </Container>
      </div>
      <Container className="py-12">
        <div className="h-36 rounded-2xl bg-muted/60" />
        <div className="mt-6 h-16 rounded-2xl bg-muted/60" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted/60" />
          ))}
        </div>
      </Container>
    </div>
  );
}
