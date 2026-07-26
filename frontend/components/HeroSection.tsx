'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { heroUrl, blurUrl } from '@/lib/cloudinary';
import type { SiteConfig } from '@/lib/types';
import ShimmerButton from '@/components/ui/ShimmerButton';
import FlipWords from '@/components/ui/FlipWords';
import Sparkles from '@/components/ui/Sparkles';

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

  const scrollToGallery = () => {
    document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const flipWordsList = ['Moments', 'Emotions', 'Stories', 'Weddings', 'Memories'];

  return (
    <div className="sticky top-0 z-0 overflow-hidden">
      <section className="relative h-[85dvh] md:h-screen w-full flex items-center justify-center overflow-hidden">
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

        {/* Ambient Dark Overlay with Vignette & Sparkles */}
        <div className="absolute inset-0 bg-black/45 backdrop-brightness-95" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
        <Sparkles particleColor="#FFE8D6" particleDensity={75} speed={1.2} />

        <div ref={textRef} className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl pt-20 md:pt-28" style={{ willChange: 'transform' }}>
          <p className="font-body text-xs md:text-sm tracking-[0.35em] uppercase text-white/80 mb-4 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
            {config?.photographer_name || 'Photographer'}
          </p>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white tracking-wide justify-center drop-shadow-[0_4px_25px_rgba(0,0,0,0.6)] leading-tight">
            Capturing <FlipWords words={flipWordsList} duration={2500} />
          </h1>

          <p className="mt-4 md:mt-6 font-display text-lg sm:text-xl md:text-2xl italic text-white/90 max-w-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            {config?.hero_subtitle || 'Photography that tells your story'}
          </p>

          {/* Inspira UI Shimmer CTA Button */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <ShimmerButton onClick={scrollToGallery} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-white/30">
              <span>Explore Portfolio</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </ShimmerButton>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          onClick={scrollToGallery}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity duration-300 z-10"
        >
          <span className="font-body text-[9px] tracking-[0.3em] uppercase text-white">Scroll</span>
          <div className="w-[18px] h-[30px] border-[1.5px] border-white/80 rounded-full flex justify-center p-[3px] bg-black/20 backdrop-blur-sm">
            <div className="w-[2.5px] h-[5px] bg-white rounded-full scroll-wheel-dot" />
          </div>
        </div>
      </section>
    </div>
  );
}
