import Image from 'next/image';
import sdgWheel from '../../Assets/SDG Wheel.png';

interface SdgLoadingProps {
  size?: number;
  className?: string;
  label?: string;
}

export default function SdgLoading({
  size = 20,
  className = '',
  label = 'Loading',
}: SdgLoadingProps) {
  return (
    <span role="status" aria-live="polite" aria-label={label} className={`flex w-fit items-center ${className}`}>
      <Image
        src={sdgWheel}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="shrink-0 animate-[spin_4s_linear_infinite]"
      />
    </span>
  );
}
