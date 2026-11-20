'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface LenisProviderProps {
  children: React.ReactNode;
}

/**
 * ─────────────────────────────────────────────────────────────────────
 *  SMOOTH SCROLL — sirf desktop mouse-wheel par
 * ─────────────────────────────────────────────────────────────────────
 *  Pehle Lenis har device par chalta tha. Mobile par yeh sabse badi
 *  performance galti thi:
 *
 *    Native touch scroll browser ke compositor thread par chalta hai —
 *    JS busy ho tab bhi 60/120fps smooth. Lenis usko `preventDefault`
 *    karke har frame JS se transform lagata hai. Matlab scroll ab main
 *    thread par aa gaya, jahan React, images aur observers pehle se
 *    kaam kar rahe hain. Isi se "mobile me lag karta hai" hota tha.
 *
 *  Ab: touch device = native scroll (kuch load nahi). Desktop mouse
 *  wheel = Lenis, jahan wo actually value deta hai.
 *
 *  Lenis dynamically import hota hai, to mobile users uska JS
 *  download hi nahi karte.
 */
export default function LenisProvider({ children }: LenisProviderProps) {
  const pathname = usePathname();

  // ── Scroll Restoration Fix ──────────────────────────────────────────
  // Browser refresh par pichli scroll position restore karta hai.
  // Sticky hero ke saath yeh hero skip kar deta hai — page seedha
  // "Featured Work" par land karta hai. Manual control se hum always
  // top par start karte hain.
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    // Page load par top pe le jao (refresh/link dono ke liye)
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // `pointer: coarse` = ungli/stylus. In devices par native scroll hi best hai.
    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    /* Admin panel me smooth scroll bilkul nahi chahiye. Wo ek work tool
       hai — lambi photo lists, tables, forms. Waha smooth scroll sirf
       "dheere" mehsoos hota hai, aur bade lists par lag karta hai
       (client ne yahi report kiya tha). Admin ko native scroll milega. */
    const isAdmin = pathname?.startsWith('/admin');

    if (prefersReduced || isTouch || isAdmin) return;

    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let rafId = 0;
    let cancelled = false;

    import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;

      const instance = new Lenis({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        // Touch ko Lenis se door hi rakho, chahe desktop touchscreen ho
        syncTouch: false,
      });

      lenis = instance;

      // CSS smooth-scroll aur Lenis dono chalein to ek doosre se ladte
      // hain — Lenis active hone par CSS wala band kar dete hain.
      document.documentElement.style.scrollBehavior = 'auto';

      const raf = (time: number) => {
        instance.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    });

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      lenis?.destroy();
      document.documentElement.style.scrollBehavior = '';
    };
  }, [pathname]);

  return <>{children}</>;
}
