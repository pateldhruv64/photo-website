'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { blurUrl } from '@/lib/cloudinary';
import type { SiteConfig } from '@/lib/types';
import type { SeoPayload } from '@/lib/seo';

interface HeroSectionProps {
  config: SiteConfig;
  seo?: SeoPayload;
}

export default function HeroSection({ config, seo }: HeroSectionProps) {
  const rawHeroPhotoId = config?.hero_photo?.public_id || '';

  // If a full Cloudinary URL was saved by mistake, cut it down to the public_id.
  // Removes only: the domain part, transformation segments like "c_fill,w_800/",
  // and a version segment like "v1700000000/". Folder names are kept.
  const heroPhotoId = rawHeroPhotoId.replace(
    /^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:[a-z]{1,3}_[^/]+\/)*(?:v\d+\/)?/i,
    '',
  );
  const hasHeroPhoto = Boolean(heroPhotoId);

  const textRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mount trigger for the opening un-clip animation
    const timer = setTimeout(() => setMounted(true), 60);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => clearTimeout(timer);
    }

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        // iPhone rubber-band scrolling can make scrollY negative
        const y = Math.max(0, window.scrollY);
        if (textRef.current) {
          textRef.current.style.transform = `translate3d(0, ${y * 0.2}px, 0)`;
          textRef.current.style.opacity = `${Math.max(0, 1 - y / 480)}`;
        }
        if (imgRef.current) {
          // only moves with scroll. The zoom lives on the inner wrapper below.
          imgRef.current.style.transform = `translate3d(0, ${y * 0.06}px, 0)`;
        }
        if (hudRef.current) {
          hudRef.current.style.transform = `translate3d(0, ${-y * 0.08}px, 0)`;
          hudRef.current.style.opacity = `${Math.max(0, 1 - y / 320)}`;
        }
        frame = 0;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
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
  const heroSubtitle =
    config?.hero_subtitle || 'Photography that tells your story';

  const specialities = (seo?.categories || []).slice(0, 3).map((c) => c.name);

  return (
    <div className="sticky top-0 z-0 overflow-hidden">
      <section
        aria-label="Introduction"
        className="relative flex h-[92dvh] w-full items-center justify-center overflow-hidden md:h-screen"
      >
        {/* ── Background ──
            Outer div: moves with scroll only (no transition, so it follows the scroll exactly).
            Inner div: plays the opening animation only (clip-path, zoom, blur). */}
        <div ref={imgRef} className="absolute inset-0 will-change-transform">
          <div
            className={`absolute inset-0 transition-[clip-path,transform,filter] duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
              mounted
                ? 'scale-[1.08] filter-none [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]'
                : 'scale-[1.15] blur-[2px] [clip-path:polygon(8%_8%,92%_8%,92%_92%,8%_92%)]'
            }`}
          >
            {hasHeroPhoto ? (
              <Image
                src={heroPhotoId}
                alt={`${brand} — professional photography${location ? ` in ${location}` : ''}`}
                fill
                priority
                fetchPriority="high"
                sizes="100vw"
                placeholder="blur"
                blurDataURL={blurUrl(heroPhotoId)}
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#2E4759] via-[#1E3446] to-[#0D1A26]" />
            )}
          </div>
        </div>

        {/* ── Lens glare sweep across the glass ── */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent transition-transform duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
            mounted
              ? 'translate-x-full -translate-y-full'
              : '-translate-x-full translate-y-full'
          }`}
        />

        {/* ── Scrims & subtle light blue photo tint ── */}
        {/* Light gradient so white typography is crisp while photo details stay bright */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/55" />
        {/* Very light, fresh blue tint — delicate soft light without making it dark */}
        <div className="absolute inset-0 bg-[#769FCD] mix-blend-soft-light opacity-[0.07]" />
        {/* Soft natural vignette */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.32) 100%)',
          }}
        />

        {/* ── Viewfinder HUD exposure badge ── */}
        <div
          ref={hudRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-6 top-28 z-10 hidden items-center gap-3 rounded-full border border-white/15 bg-ink/40 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-white/70 shadow-sm backdrop-blur-md transition-opacity duration-1000 lg:flex"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent motion-safe:animate-pulse" />
          <span>85mm · f/1.4 · 1/250s · ISO 100</span>
        </div>

        {/* ── Hero content ── */}
        <div
          ref={textRef}
          className="relative z-10 flex max-w-4xl flex-col items-center px-5 pt-16 text-center will-change-transform sm:px-6 md:pt-20"
        >
          {/* Brand chip */}
          <div
            className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-body text-[10px] uppercase tracking-[0.28em] text-white/90 backdrop-blur-md shadow-sm sm:text-[11px]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-soft motion-safe:animate-ping" />
              {brand}
              {location && <span className="text-white/50">· {location}</span>}
            </p>
          </div>

          {/* H1 title. pb-3 / -mb-3 stop the drop-shadow from being cut off by overflow-hidden */}
          <div className="overflow-hidden pb-3 -mb-3">
            <h1
              className={`font-display text-[2.6rem] font-light leading-[1.02] tracking-[-0.02em] text-white drop-shadow-[0_4px_28px_rgba(0,0,0,0.55)] transition-all duration-1000 delay-150 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:text-6xl md:text-7xl lg:text-[5.5rem] ${
                mounted
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-8 opacity-0'
              }`}
            >
              {heroTitle}
              {location && (
                <span className="mt-2 block font-display text-[1.35rem] font-light italic leading-snug tracking-normal text-white/80 sm:text-3xl md:text-4xl">
                  Photographer in {location}
                </span>
              )}
            </h1>
          </div>

          <p
            className={`mt-6 max-w-2xl font-body text-[15px] font-light leading-relaxed text-white/85 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] transition-all duration-1000 delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:text-base md:text-lg ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {heroSubtitle}
          </p>

          {/* Speciality tags */}
          {specialities.length > 0 && (
            <ul
              className={`mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-body text-[10px] uppercase tracking-[0.2em] text-white/65 transition-all duration-1000 delay-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:text-[11px] ${
                mounted
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              }`}
            >
              {specialities.map((name, i) => (
                <li key={name} className="flex items-center gap-3">
                  {i > 0 && (
                    <span
                      aria-hidden
                      className="h-1 w-1 rounded-full bg-white/35"
                    />
                  )}
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          )}

          {/* ── Action buttons ── */}
          <div
            className={`mt-9 flex w-full flex-col items-center gap-3 transition-all duration-1000 delay-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:w-auto sm:flex-row sm:gap-4 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <button
              onClick={() => scrollTo('gallery-section')}
              className="group relative w-full overflow-hidden rounded-full bg-white px-8 py-4 font-body text-[12px] uppercase tracking-[0.2em] text-ink shadow-[0_12px_32px_rgba(0,0,0,0.25)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(20,36,51,0.35)] sm:w-auto sm:py-3.5 active:scale-95"
            >
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                View Portfolio
                <svg
                  className="h-3.5 w-3.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
              {/* Sweep on hover */}
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.08] to-transparent transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-full"
              />
            </button>

            <button
              onClick={() => scrollTo('booking-section')}
              className="group relative w-full overflow-hidden rounded-full border border-white/35 bg-white/10 px-8 py-4 font-body text-[12px] uppercase tracking-[0.2em] text-white shadow-sm backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/80 hover:bg-white/20 hover:-translate-y-1 sm:w-auto sm:py-3.5 active:scale-95"
            >
              <span className="relative z-10">Book a Session</span>
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-full"
              />
            </button>
          </div>
        </div>

        {/* ── Scroll cue ── */}
        <button
          onClick={() => scrollTo('gallery-section')}
          aria-label="Scroll to gallery"
          className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2.5 opacity-70 transition-all duration-300 hover:opacity-100 hover:translate-y-1 md:flex"
        >
          <span className="font-body text-[9px] uppercase tracking-[0.32em] text-white">
            Scroll
          </span>
          <span className="flex h-[32px] w-[18px] justify-center rounded-full border-[1.5px] border-white/75 bg-black/20 p-[3px] backdrop-blur-sm shadow-sm">
            <span className="scroll-wheel-dot h-[5px] w-[2.5px] rounded-full bg-white motion-safe:animate-bounce" />
          </span>
        </button>
      </section>
    </div>
  );
}
