import { Container } from "@/components/layout/container";

export default function ProfileLoading() {
  return (
    <Container className="animate-pulse py-8">
      <div className="h-5 w-32 rounded-lg bg-muted/60" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="h-96 rounded-2xl bg-muted/60" />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-muted/60" />
          ))}
        </div>
      </div>
    </Container>
  );
}
