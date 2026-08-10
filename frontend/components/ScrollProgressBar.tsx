'use client';
import { useEffect, useRef } from 'react';

/**
 * Top scroll-progress bar.
 *
 * Pehle har scroll event par `document.body.scrollHeight` padha jaata tha.
 * Yeh ek "forced synchronous layout" hai — browser ko rukna padta hai aur
 * poore page ka layout dobara naapna padta hai, har single scroll frame par.
 * Lambe page (30+ photos ka masonry grid) par yeh scroll ko seedha
 * girata hai.
 *
 * Ab: height ek baar cache hoti hai (resize aur content badalne par hi
 * dobara naapte hain), aur update rAF me throttle hota hai — ek frame me
 * ek hi baar DOM likhte hain.
 */
export default function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let maxScroll = 0;
    let frame = 0;

    const measure = () => {
      maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    };

    const update = () => {
      frame = 0;
      if (!barRef.current || maxScroll <= 0) return;
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      barRef.current.style.transform = `scaleX(${progress})`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    measure();
    update();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });

    // Images/lazy sections load hone par page ki height badalti hai —
    // scroll listener ke bajaye observer se pata karo (bahut sasta).
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={barRef} aria-hidden="true" className="scroll-progress-bar" />;
}
