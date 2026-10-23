'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  label?: string;
  fallback?: string;
  className?: string;
}

export default function BackButton({
  label = 'Back',
  fallback = '/',
  className = 'inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer',
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
