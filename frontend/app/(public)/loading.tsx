import { Container } from "@/components/layout/container";

export default function HomeLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-[26rem] bg-muted/60 sm:h-[32rem]" />
      <Container className="py-12">
        <div className="h-16 rounded-2xl bg-muted/60" />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted/60" />
          ))}
        </div>
      </Container>
    </div>
  );
}
