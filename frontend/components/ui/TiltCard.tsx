'use client';

import React, { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  spotlightColor?: string;
  onClick?: () => void;
}

/**
 * 3D tilt + spotlight card.
 *
 * Pehle yeh framer-motion ke 4 spring motion values par chalta tha
 * (rotateX, rotateY, spotlightX, spotlightY) — har ek apna physics loop
 * chalati thi, har frame, har card ke liye. Pricing page par 3 cards =
 * 12 springs.
 *
 * Ab: mousemove ko rAF me throttle karke seedha CSS custom properties
 * set karte hain, aur smoothing CSS `transition` se aati hai. Compositor
 * transform handle karta hai, main thread free rehta hai — aur touch
 * devices par toh kuch chalta hi nahi (waha hover hota hi nahi).
 */
export default function TiltCard({
  children,
  className = '',
  maxTilt = 8,
  onClick,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;

      const { clientX, clientY } = e;
      if (frame.current) return;

      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const rect = el.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width - 0.5;
        const y = (clientY - rect.top) / rect.height - 0.5;

        el.style.setProperty('--tilt-x', `${-y * maxTilt}deg`);
        el.style.setProperty('--tilt-y', `${x * maxTilt}deg`);
      });
    },
    [maxTilt]
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    }
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={cn('tilt-card', className)}
      style={
        {
          '--tilt-x': '0deg',
          '--tilt-y': '0deg',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
