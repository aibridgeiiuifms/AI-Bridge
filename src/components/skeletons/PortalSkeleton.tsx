import SdgLoading from '@/components/SdgLoading';

export default function PortalSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
      <SdgLoading size={36} className="mx-auto" label="Loading student and educator portal" />
      <div className="h-40 rounded-3xl bg-slate-200" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((step) => (
          <div key={step} className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-slate-200" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-8 bg-slate-100 rounded-xl w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
