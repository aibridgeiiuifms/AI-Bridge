import SdgLoading from '@/components/SdgLoading';

export default function SdgWheelSkeleton() {
  return (
    <div className="py-12 sm:py-20 px-4 max-w-7xl mx-auto flex flex-col items-center justify-center animate-pulse">
      <SdgLoading size={44} label="Loading Sustainable Development Goals wheel" />
      <div className="h-6 w-48 rounded-full bg-slate-200 mb-4" />
      <div className="h-10 w-80 rounded-xl bg-slate-200 mb-8" />
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full border-8 border-dashed border-slate-200 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}
