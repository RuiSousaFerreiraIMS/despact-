/** Skeleton apresentado enquanto uma página da área autenticada carrega. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="A carregar">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
