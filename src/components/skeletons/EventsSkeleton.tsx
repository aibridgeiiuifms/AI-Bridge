export default function EventsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-pulse flex flex-col justify-between h-96"
        >
          <div className="h-48 bg-slate-200" />
          <div className="p-6 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
          <div className="p-6 pt-0">
            <div className="h-8 bg-slate-200 rounded-xl w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
