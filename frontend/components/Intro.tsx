'use client';

import { useEffect, useState } from 'react';

/**
 * ─────────────────────────────────────────────────────────────────────
 *  SHUTTER INTRO ("Niks Photos" title card → shutter upar uthta hai)
 * ─────────────────────────────────────────────────────────────────────
 *  - Head guard: Pehle session me chal chuka ho to <head> me hi `no-intro`
 *    lag jata hai — zero flash / zero black blink.
 *  - Font ready check: Cormorant font load hone ka wait karta hai, taaki
 *    text achanak jump na kare (pop-in band).
 *  - Smooth CSS Transitions: enter (blur→sharp) → hold → exit (wipe up).
 *  - Sync with Hero: 'niks:intro-out' event bhejta hai taaki HeroSection
 *    apna opening un-clip shutter ke saath hi shuru kare.
 *  - Tap / Click / Key press par turant skip.
 */
const KEY = 'niks_intro_played';

export default function Intro() {
  const [phase, setPhase] = useState<'waiting' | 'go' | 'out' | 'done'>('waiting');

  useEffect(() => {
    const root = document.documentElement;

    // Check if reduced-motion or already played in this tab session
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === '1';
    } catch {
      seen = false;
    }

    if (reduced || seen) {
      root.classList.add('no-intro');
      setPhase('done');
      return;
    }

    // Lock scrolling while intro is running
    window.scrollTo(0, 0);
    const lock = (e: Event) => e.preventDefault();
    window.addEventListener('wheel', lock, { passive: false });
    window.addEventListener('touchmove', lock, { passive: false });

    let timerStart: ReturnType<typeof setTimeout>;
    let timerWipe: ReturnType<typeof setTimeout>;
    let finished = false;
    let started = false;
    let leaving = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      root.classList.add('intro-done');
      setPhase('done');

      window.removeEventListener('wheel', lock);
      window.removeEventListener('touchmove', lock);
      window.removeEventListener('keydown', skip);

      try {
        window.scrollTo(0, 0);
        sessionStorage.setItem(KEY, '1');
      } catch {}
    };

    const leave = () => {
      if (leaving) return;
      leaving = true;
      clearTimeout(timerStart);
      root.classList.add('intro-out');
      setPhase('out');
      try {
        window.dispatchEvent(new CustomEvent('niks:intro-out'));
      } catch {}
      timerWipe = setTimeout(finish, 880);
    };

    const skip = () => {
      leave();
    };

    const start = () => {
      if (started) return;
      started = true;
      clearTimeout(timerWait);
      root.classList.add('intro-go');
      setPhase('go');
      timerStart = setTimeout(leave, 1350);
    };

    window.addEventListener('keydown', skip);

    // Wait for Cormorant Garamond font to be ready before revealing text
    // Safety fallback: max 500ms
    const timerWait = setTimeout(start, 500);

    if (document.fonts) {
      document.fonts.ready
        .then(() => {
          start();
        })
        .catch(() => {
          start();
        });
    } else {
      start();
    }

    return () => {
      clearTimeout(timerStart);
      clearTimeout(timerWipe);
      clearTimeout(timerWait);
      window.removeEventListener('wheel', lock);
      window.removeEventListener('touchmove', lock);
      window.removeEventListener('keydown', skip);
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      aria-hidden="true"
      className="intro-shutter"
      onClick={() => {
        const root = document.documentElement;
        if (!root.classList.contains('intro-out')) {
          root.classList.add('intro-out');
          try {
            window.dispatchEvent(new CustomEvent('niks:intro-out'));
          } catch {}
          setTimeout(() => {
            root.classList.add('intro-done');
            try {
              sessionStorage.setItem(KEY, '1');
            } catch {}
          }, 880);
        }
      }}
    >
      <p className="intro-text">
        <span className="intro-word">Niks</span>{' '}
        <span className="intro-word intro-word-2 italic text-[#769FCD]">
          Photos
        </span>
      </p>
    </div>
  );
}
