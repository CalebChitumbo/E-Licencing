export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-500" role="status">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      {children}
    </div>
  );
}
