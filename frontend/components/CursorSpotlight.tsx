'use client';
import { useEffect, useRef } from 'react';

export default function CursorSpotlight() {
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only activate on non-touch devices
    if (window.matchMedia('(hover: none)').matches) return;

    let rafId: number;
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let targetX = currentX;
    let targetY = currentY;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    // Smooth lerp follow — spotlight lags slightly behind cursor for organic feel
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      currentX = lerp(currentX, targetX, 0.08);
      currentY = lerp(currentY, targetY, 0.08);
      if (spotRef.current) {
        spotRef.current.style.transform =
          `translate(${currentX - 200}px, ${currentY - 200}px)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={spotRef}
      aria-hidden="true"
      className="cursor-spotlight"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 400,
        height: 400,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 9997,
        background: 'radial-gradient(circle, rgba(181,120,74,0.07) 0%, rgba(181,120,74,0.03) 40%, transparent 70%)',
        willChange: 'transform',
      }}
    />
  );
}
