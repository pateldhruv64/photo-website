'use client';
import { useEffect } from 'react';

// Defines which background color each scroll zone should have
const ZONES = [
  { start: 0,    end: 0.15, color: '#FEFCF8' },  // Hero exit
  { start: 0.15, end: 0.35, color: '#F8F3EC' },  // Gallery
  { start: 0.35, end: 0.55, color: '#FEFCF8' },  // Testimonials
  { start: 0.55, end: 0.72, color: '#1E1410' },  // Stats (dark)
  { start: 0.72, end: 0.88, color: '#FEFCF8' },  // Pricing
  { start: 0.88, end: 1.0,  color: '#F8F3EC' },  // Booking + Footer
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return { r, g, b };
}

function lerpColor(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bl = Math.round(ca.b + (cb.b - ca.b) * t);
  return `rgb(${r},${g},${bl})`;
}

export function useScrollBackground() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const progress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      let color = ZONES[0].color;

      for (let i = 0; i < ZONES.length - 1; i++) {
        const zone = ZONES[i];
        const next = ZONES[i + 1];
        if (progress >= zone.start && progress <= next.start) {
          const t = (progress - zone.start) / (next.start - zone.start);
          // Smooth transition only in the last 15% of each zone
          const smoothT = t > 0.85 ? (t - 0.85) / 0.15 : 0;
          color = smoothT > 0 ? lerpColor(zone.color, next.color, smoothT) : zone.color;
          break;
        }
      }

      document.documentElement.style.setProperty('--scroll-bg', color);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
}
