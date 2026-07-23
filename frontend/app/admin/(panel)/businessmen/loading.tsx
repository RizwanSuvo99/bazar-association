export default function BusinessmenLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-9 w-40 rounded-lg bg-muted/60" />
        <div className="h-9 w-48 rounded-lg bg-muted/60" />
      </div>
      <div className="rounded-2xl bg-card p-3">
        <div className="h-11 rounded-xl bg-muted/60" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
