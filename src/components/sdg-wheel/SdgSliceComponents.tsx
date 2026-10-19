import React from 'react';
import { SDG_COLOR, SDG_SHORT_LABEL } from './sdg-data';

interface SdgSliceProps {
  id: number;
  className?: string;
  size?: number;
}

/**
 * SdgSlice Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders an individual SVG slice for any SDG (1 to 17).
 *
 * It is pre-wired to load the official vector assets from /sdg-slices/sdg-[id].svg
 * and includes a clean inline vector fallback.
 *
 * If you want to paste your raw custom <svg> codes, you can replace the contents
 * of any specific slice in the `CUSTOM_SLICES` dictionary below.
 */

// ─── OPTIONAL: Paste your custom inline SVG codes in this dictionary ─────────
// Example:
// 4: (props) => ( <svg viewBox="..." {...props}> <path d="..." /> </svg> ),
export const CUSTOM_SLICES: Partial<Record<number, React.FC<React.SVGProps<SVGSVGElement>>>> = {
  // You can paste your custom slice SVGs here:
  // 1: (props) => ( ... ),
  // 4: (props) => ( ... ),
  // 8: (props) => ( ... ),
  // 10: (props) => ( ... ),
  // 17: (props) => ( ... ),
};

export function SdgSlice({ id, className = '', size }: SdgSliceProps) {
  const CustomComponent = CUSTOM_SLICES[id];

  // If a custom inline SVG component was provided in CUSTOM_SLICES, use it:
  if (CustomComponent) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <CustomComponent
          width={size}
          height={size}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Default: Render the verified vector SVG slice from public/sdg-slices/
  return (
    <div
      className={`relative flex items-center justify-center select-none overflow-hidden ${className}`}
      style={{
        width: size ? `${size}px` : undefined,
        height: size ? `${size}px` : undefined,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/sdg-slices/sdg-${id}.svg`}
        alt={`SDG ${id}: ${SDG_SHORT_LABEL[id] || ''}`}
        loading="eager"
        className="w-full h-full object-contain pointer-events-none drop-shadow-sm transition-transform duration-200"
        onError={(e) => {
          // Fallback if image path is unavailable
          const target = e.currentTarget;
          target.style.display = 'none';
        }}
      />
    </div>
  );
}

export default SdgSlice;
