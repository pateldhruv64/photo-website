'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import type { SiteConfig, Category } from '@/lib/types';

/* ─── Social icon paths (ek jagah, taki markup saaf rahe) ─────────── */
const SOCIALS = {
  instagram: {
    label: 'Instagram',
    path: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </>
    ),
    stroke: true,
  },
  facebook: {
    label: 'Facebook',
    path: <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />,
    stroke: false,
  },
  youtube: {
    label: 'YouTube',
    path: <path d="M23.498 6.163c-.272-1.016-1.071-1.815-2.087-2.087C19.565 3.5 12 3.5 12 3.5s-7.565 0-9.411.576c-1.016.272-1.815 1.071-2.087 2.087C0 8.01 0 12 0 12s0 3.99.502 5.837c.272 1.016 1.071 1.815 2.087 2.087C4.435 20.5 12 20.5 12 20.5s7.565 0 9.411-.576c1.016-.272 1.815-1.071 2.087-2.087C24 15.99 24 12 24 12s0-3.99-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />,
    stroke: false,
  },
} as const;

function SocialIcon({ type, size = 16 }: { type: keyof typeof SOCIALS; size?: number }) {
  const s = SOCIALS[type];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={s.stroke ? 'none' : 'currentColor'}
      stroke={s.stroke ? 'currentColor' : 'none'}
      strokeWidth={s.stroke ? 1.7 : 0}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {s.path}
    </svg>
  );
}

interface NavbarProps {
  /* Server se aaya hua data. Iske bina pehle paint par brand ka naam
     "Photography" (fallback) dikhta tha aur phir SWR load hone par badal
     jaata tha — ek bhadda flash. Ab pehli hi HTML me sahi naam hota hai. */
  config?: SiteConfig | null;
  categories?: Category[];
}

export default function Navbar({ config: initialConfig, categories: initialCategories }: NavbarProps = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const { data: config } = useSWR<SiteConfig>('/config', fetcher, {
    fallbackData: initialConfig ?? undefined,
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const { data: categories } = useSWR<Category[]>('/categories', fetcher, {
    fallbackData: initialCategories,
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const whatsappUrl = getWhatsAppUrl(config);
  const isHome = pathname === '/';

  /* Homepage par hero ke upar navbar transparent rehta hai (photo ko
     saans lene deta hai). Baaki pages par shuru se hi solid — waha koi
     dark hero nahi hai, transparent navbar invisible ho jaata.        */
  const solid = scrolled || !isHome;

  const links = useMemo(() => {
    const cats = (categories || [])
      .filter((c) => c.show_in_navbar)
      .sort((a, b) => a.navbar_order - b.navbar_order)
      .map((c) => ({ href: `/${c.slug}`, label: c.name }));

    const custom = (config?.navbar_links || [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((l) => ({ href: l.url, label: l.label }));

    return [{ href: '/', label: 'Home' }, ...cats, ...custom];
  }, [categories, config]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Menu khulne par background scroll lock
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Escape se menu band ho
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const scrollToBooking = (e: React.MouseEvent) => {
    if (!isHome) return;
    e.preventDefault();
    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const brand = config?.photographer_name || 'Photography';
  const logo = config?.studio_logo?.secure_url;

  return (
    <>
      {/* ═══ Desktop / shared header ═══ */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color,padding] duration-500 ease-editorial ${
          solid
            ? 'border-b border-line/70 bg-background/85 py-3 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent py-5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 sm:px-6 lg:px-8">
          {/* ── Brand ── */}
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3"
            aria-label={`${brand} — home`}
          >
            {logo ? (
              <span className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-line">
                <Image src={logo} alt="" fill sizes="36px" className="object-cover" unoptimized />
              </span>
            ) : (
              <span
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-colors duration-500 ${
                  solid ? 'border-line text-accent-deep' : 'border-white/30 text-white'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
            )}

            <span className="min-w-0">
              <span
                className={`block truncate font-display text-xl font-light leading-none tracking-[0.01em] transition-colors duration-500 sm:text-2xl ${
                  solid ? 'text-ink' : 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]'
                }`}
              >
                {brand}
              </span>
              <span
                className={`mt-1 hidden text-[9px] uppercase tracking-[0.3em] transition-colors duration-500 sm:block ${
                  solid ? 'text-ink-muted' : 'text-white/60'
                }`}
              >
                Photography Studio
              </span>
            </span>
          </Link>

          {/* ── Center nav ── */}
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative px-3.5 py-2 font-body text-[11px] uppercase tracking-[0.16em] transition-colors duration-300 ${
                    solid
                      ? active
                        ? 'text-ink'
                        : 'text-ink-muted hover:text-ink'
                      : active
                      ? 'text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
                  {/* Underline jo hover par draw hoti hai — pill highlight
                      se zyada editorial lagta hai */}
                  <span
                    aria-hidden
                    className={`absolute inset-x-3.5 bottom-1 h-px origin-left transition-transform duration-500 ease-editorial ${
                      solid ? 'bg-accent' : 'bg-white'
                    } ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* ── Right: socials + CTA ── */}
          <div className="hidden items-center gap-4 md:flex">
            <div
              className={`flex items-center gap-3 border-r pr-4 transition-colors duration-500 ${
                solid ? 'border-line' : 'border-white/25'
              }`}
            >
              {(['instagram', 'facebook', 'youtube'] as const).map((key) =>
                config?.social_links?.[key] ? (
                  <a
                    key={key}
                    href={config.social_links[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIALS[key].label}
                    className={`transition-all duration-300 hover:-translate-y-0.5 ${
                      solid ? 'text-ink-muted hover:text-accent-deep' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <SocialIcon type={key} />
                  </a>
                ) : null
              )}
            </div>

            <Link
              href="/#booking-section"
              onClick={scrollToBooking}
              className={`group relative overflow-hidden rounded-full px-6 py-2.5 font-body text-[11px] uppercase tracking-[0.16em] transition-all duration-500 ease-editorial hover:-translate-y-0.5 ${
                solid
                  ? 'bg-ink text-canvas'
                  : 'border border-white/40 bg-white/10 text-white backdrop-blur-md hover:bg-white/20'
              }`}
            >
              <span className="relative z-10">Book Session</span>
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-[900ms] ease-editorial group-hover:translate-x-full"
              />
            </Link>
          </div>

          {/* ── Mobile toggle ── */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            className={`-mr-2 flex h-11 w-11 items-center justify-center transition-colors duration-500 md:hidden ${
              solid ? 'text-ink' : 'text-white'
            }`}
          >
            <span className="flex h-3.5 w-6 flex-col justify-between">
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current" />
              <span className="ml-auto h-px w-2/3 bg-current" />
            </span>
          </button>
        </div>
      </header>

      {/* ═══ Mobile overlay ═══
          Yahan pehle framer-motion tha. Navbar har page par load hota hai,
          to uska import framer-motion (~35KB gz) ko MAIN bundle me le
          aata tha — sirf ek mobile menu ke fade + stagger ke liye.
          Ab wahi effect pure CSS se: koi JS nahi, aur animation
          compositor thread par chalta hai (main thread free). */}
      {mobileOpen && (
        <div
          className="menu-overlay fixed inset-0 z-[60] flex flex-col bg-obsidian md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Ambient glow — flat black se zyada alive lagta hai.
              Static hai, animated nahi, to koi per-frame cost nahi. */}
          <div className="pointer-events-none absolute -right-16 top-16 h-64 w-64 rounded-full bg-accent/15 blur-[110px]" />
          <div className="pointer-events-none absolute -left-10 bottom-32 h-48 w-48 rounded-full bg-accent-deep/12 blur-[90px]" />

          <div className="flex items-center justify-between px-5 py-5">
            <span className="font-display text-xl font-light text-white/90">{brand}</span>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center px-6 pb-6">
            {links.map((link, idx) => {
              const active = pathname === link.href;
              return (
                <div
                  key={`${link.href}-${link.label}`}
                  className="menu-item"
                  // Stagger — CSS animation-delay se, JS orchestration ke bina
                  style={{ animationDelay: `${0.05 + idx * 0.05}s` }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="group flex items-baseline justify-between border-b border-white/8 py-4"
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-body text-[10px] tabular text-white/25">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`font-display text-[1.75rem] font-light leading-none transition-transform duration-500 ease-editorial group-active:translate-x-1.5 ${
                          active ? 'text-accent-soft italic' : 'text-white/90'
                        }`}
                      >
                        {link.label}
                      </span>
                    </span>
                    <span aria-hidden className={active ? 'text-accent-soft' : 'text-white/25'}>
                      →
                    </span>
                  </Link>
                </div>
              );
            })}

            <div
              className="menu-item mt-8"
              style={{ animationDelay: `${0.08 + links.length * 0.05}s` }}
            >
              <Link
                href="/#booking-section"
                onClick={(e) => {
                  setMobileOpen(false);
                  scrollToBooking(e);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 font-body text-[12px] uppercase tracking-[0.2em] text-ink"
              >
                Book a Session
              </Link>
            </div>
          </nav>

          {/* Bottom: quick contact */}
          <div
            className="menu-item px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]"
            style={{ animationDelay: `${0.14 + links.length * 0.05}s` }}
          >
              <div className="mb-5 flex items-center justify-center gap-3">
                {(['instagram', 'facebook', 'youtube'] as const).map((key) =>
                  config?.social_links?.[key] ? (
                    <a
                      key={key}
                      href={config.social_links[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={SOCIALS[key].label}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/65 transition-colors hover:text-white"
                    >
                      <SocialIcon type={key} size={17} />
                    </a>
                  ) : null
                )}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.455L0 24zm6.59-4.846c1.66.986 3.284 1.48 4.961 1.48 5.384 0 9.765-4.382 9.768-9.77 0-2.61-1.015-5.064-2.858-6.911-1.843-1.847-4.293-2.864-6.907-2.864-5.39 0-9.773 4.382-9.776 9.77-.001 1.8.497 3.559 1.44 5.17l-.999 3.648 3.732-.977z" />
                    </svg>
                  </a>
                )}
              </div>
            <p className="text-center font-body text-[9px] uppercase tracking-[0.3em] text-white/25">
              © {new Date().getFullYear()} {brand}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
