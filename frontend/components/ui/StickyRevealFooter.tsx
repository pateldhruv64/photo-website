'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface StickyRevealFooterProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Footer ke peeche ka solid colour. Footer content scale hota hai, to side me
   * gap/white sliver na dikhe isliye ye panel ka bg hai. Apne Footer ke bg se
   * match rakho (default: #182735).
   */
  background?: string;
}

const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const clamp = (n: number, min = 0, max = 1) => Math.min(Math.max(n, min), max);

/**
 * ─────────────────────────────────────────────────────────────────────
 *  STICKY REVEAL FOOTER  (curtain reveal — zero dependency)
 * ─────────────────────────────────────────────────────────────────────
 *  Reference video jaisa behaviour:
 *    1. Footer viewport ke bottom me FIXED rehta hai, page ke content ke PEECHE.
 *    2. Page content upar jaata hai (curtain) aur footer neeche se khulta hai —
 *       sabse pehle footer ka NEECHE wala hissa dikhta hai.
 *    3. Jaise-jaise reveal hota hai:  blur 16px → 0,  dark overlay → 0,
 *       scale 0.94 → 1,  translateY 40px → 0.
 *
 *  Pehle wale version ki galtiyan (jo ab fix hain):
 *    - sticky + `top: -100vh` + `calc(100vh + h)` wala jugaad: footer viewport se
 *      lamba ho (mobile) to `top` negative ho jaata tha aur footer atak jaata tha.
 *    - 100vh mobile par address-bar ke saath badalta hai → gap / jump.
 *      Ab fixed `bottom:0` hai, 100vh ki zarurat hi nahi.
 *    - scale poore footer par lag raha tha → left/right me white sliver dikhti thi.
 *      Ab bg alag panel hai, sirf content scale hota hai.
 *    - blur bilkul tha hi nahi, aur opacity 0.3 se footer "gayab + dull" lagta tha.
 *      Ab blur + dark overlay hai (video jaisa).
 *    - `transition: 0.04s` rAF ke upar lag paida karta tha → hata diya.
 *    - SSR / pehle paint par height `auto` se measured height par jump hota tha.
 *      Ab SSR me footer normal flow me hai (no-JS me bhi dikhta hai), aur spacer
 *      height wahi hoti hai, to koi layout shift nahi.
 *    - Footer viewport se lamba ho to ab graceful fallback: normal flow me
 *      rehta hai (kata nahi), blur/fade effect phir bhi chalta hai.
 *
 *  Zaroori: iske upar wale page-content wrapper par `relative z-10` + solid bg
 *  hona chahiye (tumhare pages par pehle se hai) — wahi "curtain" hai.
 */
export default function StickyRevealFooter({
  children,
  className = '',
  background = '#182735',
}: StickyRevealFooterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const [height, setHeight] = useState(0);
  const [pinned, setPinned] = useState(false); // true = fixed reveal mode

  useIsoLayoutEffect(() => {
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let lastWidth = 0;
    let maxViewport = 0;

    /* ── 1. Footer ki asli height naapo + mode decide karo ─────────── */
    const measure = () => {
      const el = measureRef.current;
      if (!el) return;
      const h = el.offsetHeight;
      if (h <= 0) return;

      // Mobile address bar se innerHeight upar-neeche hota hai. Same width par
      // sabse bada viewport yaad rakho, taaki mode baar-baar flip na ho.
      const w = window.innerWidth;
      const vh = window.innerHeight;
      if (w !== lastWidth) {
        lastWidth = w;
        maxViewport = vh;
      } else {
        maxViewport = Math.max(maxViewport, vh);
      }

      const canPin = h <= maxViewport;
      setHeight(h);
      setPinned(canPin);
    };

    /* ── 2. Scroll progress → direct DOM styles (React re-render zero) ─ */
    const apply = () => {
      const container = containerRef.current;
      const content = contentRef.current;
      const shade = shadeRef.current;
      if (!container || !content || !shade) return;

      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;

      // Footer ka kitna hissa screen me aa chuka hai (0 → 1)
      const span = Math.min(rect.height, vh) || 1;
      const progress = reduceMotion ? 1 : clamp((vh - rect.top) / span);

      if (progress >= 1) {
        // Poora khul gaya: saare effects hata do → text ekdum crisp, GPU free
        content.style.transform = '';
        content.style.filter = '';
        content.style.willChange = '';
        shade.style.opacity = '0';
        return;
      }

      // Blur/dark pehle ~75% scroll me khatam, baaki me sirf settle hota hai
      const t = clamp(progress / 0.75);
      const inv = 1 - t;

      const blur = inv * inv * 16; // 16px → 0 (ease-out)
      const scale = 0.94 + 0.06 * t; // 0.94 → 1
      const y = inv * 40; // 40px → 0
      const dark = 0.6 * inv; // 0.6 → 0

      content.style.willChange = 'transform, filter';
      content.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      content.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';
      shade.style.opacity = dark.toFixed(3);
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        apply();
      });
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    apply();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && measureRef.current) {
      ro = new ResizeObserver(() => {
        measure();
        onScroll();
      });
      ro.observe(measureRef.current);
    }

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Mode / height badalne ke baad ek baar styles dobara sahi karo
  useIsoLayoutEffect(() => {
    window.dispatchEvent(new Event('scroll'));
  }, [pinned, height]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={
        pinned
          ? {
              // Spacer: page me footer jitni jagah leta hai. clip-path fixed
              // child ko isi box tak kaat deta hai = "curtain" window.
              height: `${height}px`,
              clipPath: 'inset(0)',
            }
          : undefined
      }
    >
      <div
        style={
          pinned
            ? {
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                height: `${height}px`,
                overflow: 'hidden',
                background,
              }
            : { position: 'relative', overflow: 'hidden', background }
        }
      >
        <div
          ref={contentRef}
          style={{ transformOrigin: '50% 100%', backfaceVisibility: 'hidden' }}
        >
          <div ref={measureRef}>{children}</div>
        </div>

        {/* Dark overlay — reveal ke shuru me footer dark dikhta hai (video jaisa) */}
        <div
          ref={shadeRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: '#000',
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
