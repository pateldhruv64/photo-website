'use client';

import { useEffect, useState } from 'react';
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

export default function BottomNav() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>('');

  const { data: config } = useSWR<SiteConfig>('/config', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const whatsappUrl = getWhatsAppUrl(config);
  const isHome = pathname === '/';

  /* Scroll ke hisaab se active tab highlight hota hai — user ko hamesha
     pata rehta hai wo page me kaha hai. IntersectionObserver scroll
     listener se kaafi sasta hai.                                       */
  useEffect(() => {
    if (!isHome) {
      setActiveSection('');
      return;
    }

    const ids = ['gallery-section', 'pricing-section', 'testimonials-section'];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      // Viewport ka beech ka hissa hi "active" maana jaata hai
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [isHome, pathname]);

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/client')) return null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const items = [
    {
      key: 'home',
      label: 'Home',
      icon: ICON.home,
      active: isHome && !activeSection,
      render: (children: React.ReactNode) => (
        <Link href="/" className="contents">
          {children}
        </Link>
      ),
    },
    {
      key: 'gallery',
      label: 'Work',
      icon: ICON.gallery,
      active: activeSection === 'gallery-section',
      onClick: () => scrollTo('gallery-section'),
    },
    {
      key: 'pricing',
      label: 'Pricing',
      icon: ICON.pricing,
      active: activeSection === 'pricing-section',
      onClick: () => scrollTo('pricing-section'),
    },
    {
      key: 'reviews',
      label: 'Reviews',
      icon: ICON.reviews,
      active: activeSection === 'testimonials-section',
      onClick: () => scrollTo('testimonials-section'),
    },
  ];

  return (
    <nav
      id="bottom-nav"
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] md:hidden"
    >
      <div className="flex items-center gap-1 rounded-full border border-white/12 bg-obsidian/95 p-1.5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        {items.map((item) => {
          const body = (
            <span
              className={`flex h-12 min-w-[3.25rem] flex-col items-center justify-center gap-[3px] rounded-full px-3 transition-colors duration-300 ${
                item.active ? 'bg-white/10 text-accent-soft' : 'text-white/55'
              }`}
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill={item.active ? 'currentColor' : 'none'}
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

          if (item.render) {
            return (
              <span key={item.key} className="block active:scale-95 transition-transform duration-200">
                {item.render(body)}
              </span>
            );
          }

          return (
            <button
              key={item.key}
              onClick={item.onClick}
              aria-current={item.active ? 'true' : undefined}
              className="block transition-transform duration-200 active:scale-95"
            >
              {body}
            </button>
          );
        })}

        {/* Primary action — visually alag, taki thumb wahi jaaye */}
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
