'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ─────────────────────────────────────────────────────────────────────
 *  SCROLL REVEAL
 * ─────────────────────────────────────────────────────────────────────
 *  Purana version me do badi galtiyan thi:
 *
 *  1. `MutationObserver(document.body, { subtree: true })` har DOM change
 *     par observer ko DISCONNECT karke poora `querySelectorAll` dobara
 *     chalata tha. React hydration, image load, SWR update, framer-motion —
 *     in sabse DOM lagataar badalta hai. Matlab scroll ke dauraan sainkdon
 *     baar poore document ka query + naya observer ban raha tha.
 *     Yeh scroll jank ka sabse bada source tha.
 *
 *  2. Elements `opacity: 0` par shuru hote hain. Agar JS late aaya ya
 *     fail hua, content permanently invisible — wahi "loading glitch"
 *     wala ehsaas.
 *
 *  Ab:
 *    - Ek hi observer, kabhi recreate nahi hota
 *    - Naye elements rAF-debounced batch me add hote hain (disconnect nahi)
 *    - `data-revealed` se dobara observe nahi karte
 *    - Failsafe: 2.5s baad jo bacha ho sab dikha do — content kabhi
 *      chhupa nahi rahega
 */
export function useScrollReveal(
  selector = '.reveal, .reveal-left, .reveal-scale, .divider-line, .rule'
) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const show = (el: Element) => {
      el.classList.add('visible');
      el.setAttribute('data-revealed', '');
    };

    // Reduced motion: kuch animate mat karo, sab turant dikha do
    if (reduced) {
      document.querySelectorAll(selector).forEach(show);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    );

    /** Sirf un elements ko observe karo jo abhi tak track nahi hue. */
    const scan = () => {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.hasAttribute('data-observed') || el.hasAttribute('data-revealed')) return;
        el.setAttribute('data-observed', '');
        observer.observe(el);
      });
    };

    scan();

    // Naye sections (lazy-loaded) ke liye MutationObserver — par ab
    // rAF me debounce hai aur observer ko chhedta nahi, sirf naye
    // elements add karta hai.
    let scanFrame = 0;
    const mo = new MutationObserver(() => {
      if (scanFrame) return;
      scanFrame = requestAnimationFrame(() => {
        scanFrame = 0;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Failsafe — kuch bhi galat ho jaaye, content invisible nahi rehna chahiye
    const failsafe = window.setTimeout(() => {
      document.querySelectorAll(`${selector}:not([data-revealed])`).forEach(show);
    }, 2500);

    return () => {
      observer.disconnect();
      mo.disconnect();
      if (scanFrame) cancelAnimationFrame(scanFrame);
      clearTimeout(failsafe);
    };
  }, [selector, pathname]);
}
