'use client';
import { useEffect, useRef } from 'react';

export default function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const progress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${Math.min(progress, 1)})`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="scroll-progress-bar"
      style={{ width: '100vw' }}
    />
  );
}
