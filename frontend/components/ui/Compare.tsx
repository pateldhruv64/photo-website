'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface CompareProps {
  firstImage: string;
  secondImage: string;
  firstImageAlt?: string;
  secondImageAlt?: string;
  firstLabel?: string;
  secondLabel?: string;
  className?: string;
}

export default function Compare({
  firstImage,
  secondImage,
  firstImageAlt = 'RAW Unedited Image',
  secondImageAlt = 'Color Graded Final Image',
  firstLabel = 'RAW (Unedited)',
  secondLabel = 'Final (Retouched)',
  className = '',
}: CompareProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    setSliderPosition(percentage);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && e.buttons !== 1) return;
    handleMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDragging(false)}
      className={`relative overflow-hidden select-none cursor-col-resize rounded-3xl shadow-2xl border border-white/20 touch-pan-y ${className}`}
    >
      {/* Second Layer (Underneath - Final Retouched Image) */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={secondImage}
          alt={secondImageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 1200px) 100vw, 1200px"
          unoptimized
        />
        {secondLabel && (
          <span className="absolute top-4 right-4 bg-[#1E1410]/80 backdrop-blur-md text-amber-300 text-xs font-body font-semibold px-3 py-1.5 rounded-full border border-white/10 shadow-lg z-10">
            {secondLabel}
          </span>
        )}
      </div>

      {/* First Layer (Clipped - RAW Unedited Image) */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={firstImage}
          alt={firstImageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 1200px) 100vw, 1200px"
          unoptimized
        />
        {firstLabel && (
          <span className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white/90 text-xs font-body font-semibold px-3 py-1.5 rounded-full border border-white/10 shadow-lg z-10">
            {firstLabel}
          </span>
        )}
      </div>

      {/* Divider Handle Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] z-30 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Drag Knob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white text-[#1E1410] shadow-2xl flex items-center justify-center border-2 border-[#1E1410]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 9l-3 3 3 3m8-6l3 3-3 3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
