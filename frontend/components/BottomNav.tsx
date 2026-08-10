'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import type { SiteConfig } from '@/lib/types';

const ICON = {
  home: (
    <>
      <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20V9.5z" />
      <path d="M9 21v-7a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v7" />
    </>
  ),
  gallery: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
      <circle cx="8.5" cy="8.5" r="1.4" />
      <polyline points="21 15 16 10 5 21" />
    </>
  ),
  pricing: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.3" />
    </>
  ),
  reviews: (
    <polygon points="12 2.5 14.9 8.4 21.4 9.3 16.7 13.9 17.8 20.3 12 17.3 6.2 20.3 7.3 13.9 2.6 9.3 9.1 8.4 12 2.5" />
  ),
};

/* Tab -> section mapping. Order matters: page par jis kram me sections
   aate hain, usi kram me. */
const SECTIONS = [
  { key: 'home', label: 'Home', icon: ICON.home, id: null },
  { key: 'gallery', label: 'Work', icon: ICON.gallery, id: 'gallery-section' },
  { key: 'pricing', label: 'Pricing', icon: ICON.pricing, id: 'pricing-section' },
  { key: 'reviews', label: 'Reviews', icon: ICON.reviews, id: 'testimonials-section' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const [active, setActive] = useState<string>('home');
  const navRef = useRef<HTMLElement>(null);

  const { data: config } = useSWR<SiteConfig>('/config', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const whatsappUrl = getWhatsAppUrl(config);
  const isHome = pathname === '/';

  /* ── Active tab detection ──
     Pehle IntersectionObserver `rootMargin: -45% 0px -45%` ke saath tha.
     Wo viewport ke beech me sirf 10% ki ek patti banata hai — agar us
     patti me kisi section ka hissa na aaye (lambe section ke andar, ya
     do sections ke beech me), to koi entry fire hi nahi hoti aur
     highlight PICHLE tab par atka reh jaata hai. Screenshot me yahi
     dikh raha tha: user neeche tha par "Work" selected reh gaya.

     Ab: har section ka top offset ek baar naapte hain, aur scroll par
     dekhte hain viewport ka center kis section me hai. Koi dead zone
     nahi — har scroll position ka ek hi sahi jawab hota hai. */
  useEffect(() => {
    if (!isHome) {
      setActive('');
      return;
    }

    let offsets: Array<{ key: string; top: number }> = [];
    let frame = 0;

    const measure = () => {
      offsets = SECTIONS.filter((s) => s.id)
        .map((s) => {
          const el = document.getElementById(s.id as string);
          if (!el) return null;
          return { key: s.key, top: el.getBoundingClientRect().top + window.scrollY };
        })
        .filter(Boolean) as Array<{ key: string; top: number }>;
      offsets.sort((a, b) => a.top - b.top);
    };

    const update = () => {
      frame = 0;
      if (!offsets.length) return;

      // Viewport ka center — yahi "user abhi kahan hai" ka sabse
      // seedha jawab hai.
      const probe = window.scrollY + window.innerHeight / 2;

      // Page ke bilkul neeche pahunch gaye to aakhri section active
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) {
        setActive(offsets[offsets.length - 1].key);
        return;
      }

      let current = 'home';
      for (const o of offsets) {
        if (probe >= o.top) current = o.key;
        else break;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    measure();
    update();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });

    // Lazy sections/images load hone par offsets badal jaate hain
    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(document.body);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isHome, pathname]);

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/client')) return null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      ref={navRef}
      id="bottom-nav"
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] md:hidden"
    >
      <div className="flex items-center gap-1 rounded-full border border-white/12 bg-obsidian/95 p-1.5 shadow-[0_12px_40px_-8px_rgba(8,16,24,0.6)] backdrop-blur-2xl">
        {SECTIONS.map((item) => {
          const isActive = active === item.key;

          const body = (
            <span
              className={`flex h-12 min-w-[3.25rem] flex-col items-center justify-center gap-[3px] rounded-full px-3 transition-colors duration-300 ${
                isActive ? 'bg-white/10 text-accent-soft' : 'text-white/55'
              }`}
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill={isActive ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {item.icon}
              </svg>
              <span className="text-[9px] font-medium tracking-[0.06em]">{item.label}</span>
            </span>
          );

          // Home: dusre page par asli link chahiye, homepage par sirf scroll-to-top
          if (item.key === 'home') {
            return isHome ? (
              <button
                key={item.key}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-current={isActive ? 'true' : undefined}
                className="transition-transform duration-200 active:scale-95"
              >
                {body}
              </button>
            ) : (
              <Link
                key={item.key}
                href="/"
                className="transition-transform duration-200 active:scale-95"
              >
                {body}
              </Link>
            );
          }

          // Section tabs: homepage par scroll, baaki pages par home + hash
          return isHome ? (
            <button
              key={item.key}
              onClick={() => scrollTo(item.id as string)}
              aria-current={isActive ? 'true' : undefined}
              className="transition-transform duration-200 active:scale-95"
            >
              {body}
            </button>
          ) : (
            <Link
              key={item.key}
              href={`/#${item.id}`}
              className="transition-transform duration-200 active:scale-95"
            >
              {body}
            </Link>
          );
        })}

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="ml-0.5 flex h-12 min-w-[3.25rem] flex-col items-center justify-center gap-[3px] rounded-full bg-[#25D366] px-3 text-white transition-transform duration-200 active:scale-95"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.455L0 24zm6.59-4.846c1.66.986 3.284 1.48 4.961 1.48 5.384 0 9.765-4.382 9.768-9.77 0-2.61-1.015-5.064-2.858-6.911-1.843-1.847-4.293-2.864-6.907-2.864-5.39 0-9.773 4.382-9.776 9.77-.001 1.8.497 3.559 1.44 5.17l-.999 3.648 3.732-.977z" />
            </svg>
            <span className="text-[9px] font-medium tracking-[0.06em]">Chat</span>
          </a>
        ) : (
          <button
            onClick={() => scrollTo('booking-section')}
            aria-label="Book a session"
            className="ml-0.5 flex h-12 min-w-[3.25rem] flex-col items-center justify-center gap-[3px] rounded-full bg-white px-3 text-ink transition-transform duration-200 active:scale-95"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-[9px] font-medium tracking-[0.06em]">Book</span>
          </button>
        )}
      </div>
    </nav>
  );
}
