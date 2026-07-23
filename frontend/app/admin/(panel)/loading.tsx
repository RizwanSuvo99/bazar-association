export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 w-48 rounded-lg bg-muted/60" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-full min-h-64 rounded-2xl bg-muted/60 sm:col-span-2 lg:row-span-2" />
        <div className="h-32 rounded-2xl bg-muted/60" />
        <div className="h-32 rounded-2xl bg-muted/60" />
        <div className="h-32 rounded-2xl bg-muted/60" />
        <div className="h-32 rounded-2xl bg-muted/60" />
        <div className="h-48 rounded-2xl bg-muted/60 sm:col-span-2 lg:col-span-4" />
      </div>
    </div>
  );
}
