import SdgLoading from '@/components/SdgLoading';

export default function HighlightsCarouselSkeleton() {
  return (
    <div className="flex flex-col w-full animate-pulse">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="h-5 w-28 rounded-full bg-emerald-950/40" />
        <div className="h-4 w-10 rounded bg-emerald-950/40" />
      </div>
      <div className="relative aspect-video w-full rounded-2xl border border-white/10 bg-slate-900/60 flex items-center justify-center">
        <SdgLoading size={40} label="Loading featured highlights" />
      </div>
    </div>
  );
}
