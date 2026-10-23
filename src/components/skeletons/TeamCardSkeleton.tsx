export function TeamCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 space-y-4 animate-pulse shadow-xs">
      <div className="w-20 h-20 rounded-full bg-slate-200 mx-auto" />
      <div className="space-y-2 text-center">
        <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
        <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto" />
      </div>
      <div className="h-8 bg-slate-100 rounded-xl w-full" />
    </div>
  );
}

export function TeamSectionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <TeamCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default TeamCardSkeleton;
