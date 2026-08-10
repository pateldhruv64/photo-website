'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { heroUrl, blurUrl } from '@/lib/cloudinary';
import type { SiteConfig } from '@/lib/types';
import type { SeoPayload } from '@/lib/seo';

interface HeroSectionProps {
  config: SiteConfig;
  seo?: SeoPayload;
}

export default function HeroSection({ config, seo }: HeroSectionProps) {
  const hasHeroPhoto = Boolean(config?.hero_photo?.public_id);
  const textRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  /* Parallax: text upar jaata hai aur fade hota hai, image dheere neeche
     drift karti hai. Do alag speeds se depth ka ehsaas banta hai.
     rAF me batch kar rahe hain taki scroll janky na ho.               */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (textRef.current) {
          textRef.current.style.transform = `translate3d(0, ${y * 0.14}px, 0)`;
          textRef.current.style.opacity = `${Math.max(0, 1 - y / 480)}`;
        }
        if (imgRef.current) {
          imgRef.current.style.transform = `translate3d(0, ${y * 0.05}px, 0) scale(1.1)`;
        }
        frame = 0;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const brand = seo?.brand || config?.photographer_name || 'Photographer';
  const location = seo?.location || '';
  const heroTitle = config?.hero_title || 'Capturing Moments';
  const heroSubtitle = config?.hero_subtitle || 'Photography that tells your story';

  // Top 3 categories — keyword-rich, aur user ko turant pata chalta hai
  // ki yeh photographer kya shoot karta hai.
  const specialities = (seo?.categories || []).slice(0, 3).map((c) => c.name);

  return (
    <div className="sticky top-0 z-0 overflow-hidden">
      <section
        aria-label="Introduction"
        className="relative flex h-[92dvh] w-full items-center justify-center overflow-hidden md:h-screen"
      >
        {/* ── Background ── */}
        <div ref={imgRef} className="absolute inset-0 scale-110 will-change-transform">
          {hasHeroPhoto ? (
            <Image
              src={heroUrl(config.hero_photo!.public_id)}
              alt={`${brand} — professional photography${location ? ` in ${location}` : ''}`}
              fill
              priority
              fetchPriority="high"
              sizes="100vw"
              placeholder="blur"
              blurDataURL={blurUrl(config.hero_photo!.public_id)}
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#2E4759] via-[#1E3446] to-[#0D1A26]" />
          )}
        </div>

        {/* ── Scrims ──
            Photographer site hai — photo hi hero hai, use dabana nahi
            chahiye. Isliye flat overlay halka (25%) rakha hai aur text
            ka contrast top/bottom gradient se aata hai, jahan text
            actually baithta hai. Blue tint bas 12% — itna ki photo brand
            palette me ghul jaaye, itna nahi ki dhul jaaye. */}
        <div className="absolute inset-0 bg-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/15 to-ink/75" />
        <div className="absolute inset-0 bg-accent mix-blend-soft-light opacity-[0.12]" />

        {/* Vignette — nazar center par rakhta hai */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 48%, rgba(8,16,24,0.42) 100%)',
          }}
        />

        {/* ── Content ── */}
        <div
          ref={textRef}
          className="relative z-10 flex max-w-4xl flex-col items-center px-5 pt-16 text-center will-change-transform sm:px-6 md:pt-20"
        >
          {/* Brand chip */}
          <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-body text-[10px] uppercase tracking-[0.28em] text-white/90 backdrop-blur-md sm:text-[11px]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-soft" />
            {brand}
            {location && <span className="text-white/50">· {location}</span>}
          </p>

          {/* H1 — page ka sabse important SEO element.
              Server par render hota hai, koi client-only animation nahi
              jo text ko crawler se chhupa de. */}
          <h1 className="font-display text-[2.6rem] font-light leading-[1.02] tracking-[-0.02em] text-white drop-shadow-[0_4px_28px_rgba(0,0,0,0.55)] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            {heroTitle}
            {location && (
              <span className="mt-2 block font-display text-[1.35rem] font-light italic leading-snug tracking-normal text-white/80 sm:text-3xl md:text-4xl">
                Photographer in {location}
              </span>
            )}
          </h1>

          <p className="mt-6 max-w-2xl font-body text-[15px] font-light leading-relaxed text-white/85 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-base md:text-lg">
            {heroSubtitle}
          </p>

          {/* Speciality pills — crawlable keywords + instant clarity */}
          {specialities.length > 0 && (
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-body text-[10px] uppercase tracking-[0.2em] text-white/65 sm:text-[11px]">
              {specialities.map((name, i) => (
                <li key={name} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-white/35" />}
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          )}

          {/* ── CTAs ── */}
          <div className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
            <button
              onClick={() => scrollTo('gallery-section')}
              className="group relative w-full overflow-hidden rounded-full bg-white px-8 py-4 font-body text-[12px] uppercase tracking-[0.2em] text-ink transition-transform duration-500 ease-editorial hover:-translate-y-0.5 sm:w-auto sm:py-3.5"
            >
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                View Portfolio
                <svg
                  className="h-3.5 w-3.5 transition-transform duration-500 ease-editorial group-hover:translate-y-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              {/* Sheen sweep on hover */}
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.06] to-transparent transition-transform duration-[900ms] ease-editorial group-hover:translate-x-full"
              />
            </button>

            <button
              onClick={() => scrollTo('booking-section')}
              className="w-full rounded-full border border-white/35 px-8 py-4 font-body text-[12px] uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all duration-500 ease-editorial hover:border-white/70 hover:bg-white/10 sm:w-auto sm:py-3.5"
            >
              Book a Session
            </button>
          </div>
        </div>

        {/* ── Scroll cue ── */}
        <button
          onClick={() => scrollTo('gallery-section')}
          aria-label="Scroll to gallery"
          className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2.5 opacity-70 transition-opacity duration-300 hover:opacity-100 md:flex"
        >
          <span className="font-body text-[9px] uppercase tracking-[0.32em] text-white">Scroll</span>
          <span className="flex h-[30px] w-[18px] justify-center rounded-full border-[1.5px] border-white/75 bg-black/20 p-[3px] backdrop-blur-sm">
            <span className="scroll-wheel-dot h-[5px] w-[2.5px] rounded-full bg-white" />
          </span>
        </button>
      </section>
    </div>
  );
}
