'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ─────────────────────────────────────────────────────────────────────
 *  BESPOKE CAMERA VIEWFINDER & FOCUS RETICLE CURSOR
 * ─────────────────────────────────────────────────────────────────────
 *  Desktop-only (pointer: fine).
 *  Ek ordinary cursor ke badle yeh luxury camera viewfinder ka ehsaas
 *  deta hai:
 *    - Default: Delicate 4-corner brackets + center focal dot
 *    - Photo Hover: Focus brackets snap outward, AF-LOCK indicator active
 *    - Button/Link: Reticle tightens, micro-label "VIEW" / "SELECT"
 *    - Click: Camera shutter trigger recoil (scale compression)
 *
 *  Performance:
 *    - Pure rAF transform throttling (zero main-thread jank)
 *    - Touch / Mobile devices par 0% listeners, 0 DOM nodes rendered
 *    - prefers-reduced-motion fully respected
 */
type CursorMode = 'default' | 'photo' | 'action';

export default function CameraCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [moved, setMoved] = useState(false);
  const [mode, setMode] = useState<CursorMode>('default');
  const [active, setActive] = useState(false);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) {
      setEnabled(false);
      return;
    }

    const mql = window.matchMedia('(pointer: fine)');
    if (!mql.matches) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setEnabled(false);
      return;
    }

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

    const onMove = (e: PointerEvent) => {
      // Center the 36x36 reticle directly under the mouse tip
      x = e.clientX - 18;
      y = e.clientY - 18;
      if (!moved) setMoved(true);
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;

      if (t.closest('figure, [data-photo-card], .photo-card, .protected-image')) {
        setMode('photo');
      } else if (t.closest('a, button, input, select, textarea, [role="button"]')) {
        setMode('action');
      } else {
        setMode('default');
      }
    };

    const onDown = () => setActive(true);
    const onUp = () => setActive(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isAdmin]);

  if (!enabled) return null;

  const isPhoto = mode === 'photo';
  const isAction = mode === 'action';

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 top-0 z-[9999] select-none transition-opacity duration-200 ${
        moved ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ willChange: 'transform' }}
    >
      <div
        className={`relative flex h-9 w-9 items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          active ? 'scale-75' : isPhoto ? 'scale-125' : isAction ? 'scale-110' : 'scale-100'
        }`}
      >
        {/* ── Viewfinder Reticle Frame (4 Brackets) ── */}
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-colors duration-200 ${
            isPhoto
              ? 'text-accent'
              : isAction
              ? 'text-accent-deep'
              : 'text-ink-soft/70'
          }`}
        >
          {/* Top-Left Bracket */}
          <path d="M4 11V4H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          {/* Top-Right Bracket */}
          <path d="M25 4H32V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          {/* Bottom-Left Bracket */}
          <path d="M4 25V32H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          {/* Bottom-Right Bracket */}
          <path d="M25 32H32V25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

          {/* Center Focal Crosshair Dot */}
          <circle
            cx="18"
            cy="18"
            r={isPhoto || isAction ? '2.5' : '1.5'}
            className={`transition-all duration-200 ${
              isPhoto ? 'fill-accent' : isAction ? 'fill-accent-deep' : 'fill-currentColor'
            }`}
          />

          {/* Micro crosshair ticks on hover */}
          {(isPhoto || isAction) && (
            <>
              <line x1="18" y1="10" x2="18" y2="13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="18" y1="23" x2="18" y2="26" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="10" y1="18" x2="13" y2="18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="23" y1="18" x2="26" y2="18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </>
          )}
        </svg>

        {/* ── Focal Status Tag (Camera Viewfinder Metadata) ── */}
        {isPhoto && (
          <span
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-ink/90 px-1.5 py-0.5 font-mono text-[8px] font-semibold tracking-[0.2em] text-accent-soft shadow-sm backdrop-blur-md transition-opacity duration-200"
          >
            AF·LOCK
          </span>
        )}
      </div>
    </div>
  );
}
