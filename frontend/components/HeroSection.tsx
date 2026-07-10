'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { heroUrl, blurUrl } from '@/lib/cloudinary';
import type { SiteConfig } from '@/lib/types';

interface HeroSectionProps { config: SiteConfig; }

export default function HeroSection({ config }: HeroSectionProps) {
  const hasHeroPhoto = config?.hero_photo?.public_id;
  const imgRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (textRef.current) {
        textRef.current.style.transform = `translateY(${scrollY * 0.12}px)`;
        textRef.current.style.opacity = `${Math.max(0, 1 - scrollY / 500)}`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!textRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      textRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="sticky top-0 z-0 overflow-hidden">
      <section className="relative h-[65vh] md:h-screen w-full flex items-center justify-center overflow-hidden">
        <div ref={imgRef} className="absolute inset-0 scale-110" style={{ willChange: 'transform' }}>
          {hasHeroPhoto ? (
            <Image
              src={heroUrl(config.hero_photo!.public_id)}
              alt={config.hero_title || 'Hero'}
              fill
              priority
              fetchPriority="high"
              sizes="100vw"
              placeholder="blur"
              blurDataURL={blurUrl(config.hero_photo!.public_id)}
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#F8F3EC] to-[#EDE4D8]" />
          )}
        </div>
        <div className="absolute inset-0 bg-black/35" />
        <div ref={textRef} className="relative z-10 text-center px-4 max-w-4xl pt-20 md:pt-28 float-on-mouse" style={{ willChange: 'transform' }}>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white tracking-wide animate-fade-in drop-shadow-[0_2px_15px_rgba(0,0,0,0.5)]">
            {config?.hero_title || 'Capturing Moments'}
          </h1>
          <p className="mt-4 md:mt-6 font-display text-lg sm:text-xl md:text-2xl italic text-white/90 animate-fade-in-up drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]" style={{ animationDelay: '0.3s' }}>
            {config?.hero_subtitle || 'Photography that tells your story'}
          </p>
          <p className="mt-8 font-body text-xs md:text-sm tracking-[0.3em] uppercase text-white/70 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            {config?.photographer_name || 'Photographer'}
          </p>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 cursor-pointer opacity-75 hover:opacity-100 transition-opacity duration-300">
          <span className="font-body text-[9px] tracking-[0.3em] uppercase text-white">Scroll</span>
          <div className="w-[18px] h-[30px] border-[1.5px] border-white rounded-full flex justify-center p-[3px]">
            <div className="w-[2.5px] h-[5px] bg-white rounded-full scroll-wheel-dot" />
          </div>
        </div>
      </section>
    </div>
  );
}
