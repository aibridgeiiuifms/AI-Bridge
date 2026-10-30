import Image from 'next/image';

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
      <span className="sdg-wheel relative inline-block shrink-0" style={{ width: size, height: size }} aria-hidden="true">
        <Image
          src="/sdg-wheel-loader.svg"
          alt=""
          aria-hidden="true"
          width={size}
          height={size}
          className="h-full w-full object-contain"
        />
      </span>
    </span>
  );
}
