import { Container } from "@/components/layout/container";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="bg-card">
      <Container className="py-14 sm:py-16">
        <h1 className="font-display text-4xl font-bold leading-snug text-foreground sm:text-5xl">{title}</h1>
        <div className="mt-4 h-0.5 w-16 bg-primary" aria-hidden />
        {subtitle && <p className="mt-4 max-w-2xl text-muted-foreground">{subtitle}</p>}
      </Container>
    </section>
  );
}
