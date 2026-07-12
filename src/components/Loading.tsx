import { Crest } from "./Crest";

// Shown instantly during navigation while a tab's data loads.
export function Loading({ label = "Pouring…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Crest size={48} />
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brass/30 border-t-racing" />
      <p className="font-body text-sm italic text-ink-soft">{label}</p>
    </div>
  );
}
