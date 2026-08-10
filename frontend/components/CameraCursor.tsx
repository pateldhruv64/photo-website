'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Custom camera cursor — sirf desktop (fine pointer) par.
 *
 * Pehle yeh component mobile par bhi mount hota tha: `pointermove`,
 * `pointerdown` aur `mouseover` — teen global listeners, plus har
 * pointerdown par React state update. Touch device par isse koi fayda
 * nahi tha (cursor hota hi nahi) par cost poori thi.
 *
 * Ab pehle hi check me touch device par kuch render nahi hota aur koi
 * listener attach nahi hota.
 */
export default function CameraCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const pathname = usePathname();
  // Admin ek work tool hai — waha custom cursor sirf raaste me aata hai
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) {
      setEnabled(false);
      return;
    }

    const mql = window.matchMedia('(pointer: fine)');
    if (!mql.matches) return;

    setEnabled(true);

    let frame = 0;
    let x = 0;
    let y = 0;

    const paint = () => {
      frame = 0;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    // rAF throttle — pointermove 1000Hz mouse par bahut baar fire hota hai,
    // par paint karne ka matlab frame me ek hi baar hai.
    const onMove = (e: PointerEvent) => {
      x = e.clientX + 22;
      y = e.clientY + 12;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      setHovering(Boolean(t?.closest('a, button')));
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('mouseover', onOver);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isAdmin]);

  if (!enabled) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] text-ink drop-shadow-md"
      style={{ willChange: 'transform' }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-transform duration-300 ${hovering ? 'rotate-12 scale-110' : ''}`}
      >
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    </div>
  );
}
