export function BarraProgreso({
  actual,
  total,
  label = "Avance",
}: {
  actual: number;
  total: number;
  label?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
