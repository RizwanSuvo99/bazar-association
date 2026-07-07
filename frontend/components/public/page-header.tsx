import { Container } from "@/components/layout/container";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-card">
      <div className="bazar-awning absolute inset-0 opacity-60" aria-hidden />
      <Container className="relative py-12 sm:py-14">
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
      </Container>
    </section>
  );
}
