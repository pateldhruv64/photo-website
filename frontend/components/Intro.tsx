'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ─────────────────────────────────────────────────────────────────────
 *  SHUTTER INTRO (Cinematic Editorial Reveal)
 * ─────────────────────────────────────────────────────────────────────
 *  - Fixed dark curtain (#0b131a) from frame 0 -> zero white flash on refresh
 *  - Text Entrance (Open): "Niks Photos" glides up from masked bottom
 *  - Text Hold: Sits crystal clear in center
 *  - Text Exit (Close): Glides up and vanishes through top mask
 *  - Shutter Wipe: Curtain wipes up right behind the text to reveal Hero section
 *  - Zero double-blink on hydration: Controlled via initiated ref
 *  - No progress bar
 */
export default function Intro() {
  const [visible, setVisible] = useState(true);
  const [active, setActive] = useState(false);
  const initiatedRef = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen =
      typeof window !== 'undefined' &&
      sessionStorage.getItem('niks_intro_played') === '1';

    if (reduced || seen) {
      setVisible(false);
      return;
    }

    if (initiatedRef.current) return;
    initiatedRef.current = true;

    // Ensure scroll starts exactly at top
    window.scrollTo(0, 0);

    // Start choreographed motion once on client
    setActive(true);

    // Prevent wheel and touch scrolling during the shutter sequence
    const prevent = (e: Event) => e.preventDefault();
    window.addEventListener('wheel', prevent, { passive: false });
    window.addEventListener('touchmove', prevent, { passive: false });

    // Complete shutter sequence after wipe finishes (1.25s delay + 0.85s wipe = 2.10s)
    const timer = setTimeout(() => {
      window.removeEventListener('wheel', prevent);
      window.removeEventListener('touchmove', prevent);
      window.scrollTo(0, 0);
      setVisible(false);
      try {
        sessionStorage.setItem('niks_intro_played', '1');
      } catch {}
    }, 2150);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('wheel', prevent);
      window.removeEventListener('touchmove', prevent);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`intro-shutter ${active ? 'intro-shutter--active' : ''}`}
    >
      <div className="overflow-hidden px-6 py-3">
        <p
          className={`intro-text ${active ? 'intro-text--active' : ''}`}
          suppressHydrationWarning
        >
          Niks <span className="italic text-[#769FCD]">Photos</span>
        </p>
      </div>
    </div>
  );
}
