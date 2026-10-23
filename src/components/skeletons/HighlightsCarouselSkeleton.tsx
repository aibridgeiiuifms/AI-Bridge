export default function HighlightsCarouselSkeleton() {
  return (
    <div className="flex flex-col w-full animate-pulse" aria-hidden="true">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="h-5 w-28 rounded-full bg-emerald-950/40" />
        <div className="h-4 w-10 rounded bg-emerald-950/40" />
      </div>
      <div className="relative aspect-video w-full rounded-2xl border border-white/10 bg-slate-900/60 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full bg-white/10" />
      </div>
    </div>
  );
}
