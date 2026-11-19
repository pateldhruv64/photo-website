'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import { fetcher } from '@/lib/fetcher';

interface Testimonial {
  _id: string;
  client_name: string;
  event_type: string;
  review_text: string;
  rating: number;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
}

interface Props {
  initialTestimonials?: Testimonial[];
}

const LUXURY_FALLBACKS: Testimonial[] = [
  {
    _id: 'lux-1',
    client_name: 'Aanya & Siddharth',
    event_type: 'ROYAL PALACE WEDDING, UDAIPUR',
    review_text:
      'Nikunj has this extraordinary, quiet intuition for light and intimacy. Looking through our wedding gallery felt like turning the pages of an Italian Vogue editorial. Every tear, every laugh, and every subtle glance was captured with sheer cinematic brilliance.',
    rating: 5,
    photo_url: 'https://res.cloudinary.com/dkyonzfbo/image/upload/v1783573813/portfolio/f70rmdumjwbcye0d6zn1.jpg',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: 'lux-2',
    client_name: 'Natasha Malhotra',
    event_type: 'HIGH-FASHION EDITORIAL & PORTRAIT',
    review_text:
      'The lighting direction was utterly world-class. Nikunj crafts atmosphere with Rembrandt-like precision. The final deliverables blew our agency away — immaculate skin texture, rich color grading, and an effortless, high-end fine art aura.',
    rating: 5,
    photo_url: 'https://res.cloudinary.com/dkyonzfbo/image/upload/v1783573822/portfolio/jrezg1luyga0k9jxcuj0.jpg',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    _id: 'lux-3',
    client_name: 'Karan & Rhea Singhania',
    event_type: 'SUNSET PRE-WEDDING, GOA',
    review_text:
      'From our golden hour session on the cliffs to the midnight celebrations, Nikunj made us feel completely natural and unposed. He captured moments we did not even know happened. Investing in his lens was the single best decision of our entire wedding.',
    rating: 5,
    photo_url: 'https://res.cloudinary.com/dkyonzfbo/image/upload/v1783573829/portfolio/osv3wkc1aoglmwmthwdf.jpg',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export default function TestimonialsSection({ initialTestimonials }: Props = {}) {
  const { data: testimonials } = useSWR<Testimonial[]>('/testimonials', fetcher, {
    fallbackData: initialTestimonials,
    revalidateOnFocus: false,
    revalidateOnMount: !initialTestimonials?.length,
    dedupingInterval: 3600000,
  });

  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // ── Drag & Fluid Physics States ──
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [velocity, setVelocity] = useState(0);
  const [flingDirection, setFlingDirection] = useState<'left' | 'right' | null>(null);
  const [isWobbling, setIsWobbling] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const dragStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const lastSampleRef = useRef<{ x: number; time: number }>({ x: 0, time: 0 });
  const wobbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const slabRef = useRef<HTMLDivElement | null>(null);

  // Filter or fallback to luxury reviews
  const rawActive = testimonials?.filter((t) => t.is_active) || [];
  const activeList: Testimonial[] = rawActive.length > 0
    ? rawActive.map((item, idx) => {
        const isDummy = !item.review_text || item.review_text.length < 15 || /^[a-z]{4,}$/i.test(item.review_text.trim());
        if (isDummy && LUXURY_FALLBACKS[idx % LUXURY_FALLBACKS.length]) {
          const fallback = LUXURY_FALLBACKS[idx % LUXURY_FALLBACKS.length];
          return {
            ...item,
            client_name: isDummy ? fallback.client_name : item.client_name,
            event_type: isDummy ? fallback.event_type : item.event_type,
            review_text: fallback.review_text,
            photo_url: item.photo_url || fallback.photo_url,
          };
        }
        return item;
      })
    : LUXURY_FALLBACKS;

  const total = activeList.length;

  const handleNext = useCallback(() => {
    if (total === 0) return;
    setActiveIdx((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    setActiveIdx((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-advance every 8s when not hovered or dragged
  useEffect(() => {
    if (isHovered || isDragging || flingDirection || total <= 1) return;
    const timer = setInterval(handleNext, 8000);
    return () => clearInterval(timer);
  }, [isHovered, isDragging, flingDirection, total, handleNext]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
      if (flingTimerRef.current) clearTimeout(flingTimerRef.current);
    };
  }, []);

  // ── Fluid Pointer / Touch Physics ──
  const handlePointerDown = (e: React.PointerEvent) => {
    if (flingDirection || total <= 1) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const now = performance.now();
    dragStartRef.current = { x: e.clientX, y: e.clientY, time: now };
    lastSampleRef.current = { x: e.clientX, time: now };

    setIsDragging(true);
    setIsWobbling(false);
    setVelocity(0);
    setDragOffset({ x: 0, y: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) {
      // Dynamic Apple Caustics tracking across the slab
      if (slabRef.current) {
        const rect = slabRef.current.getBoundingClientRect();
        setMousePos({
          x: Math.round(e.clientX - rect.left),
          y: Math.round(e.clientY - rect.top),
        });
      }
      return;
    }

    const now = performance.now();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Calculate instantaneous horizontal velocity (px/ms)
    const dt = Math.max(1, now - lastSampleRef.current.time);
    const instVelocity = (e.clientX - lastSampleRef.current.x) / dt;
    setVelocity(instVelocity);
    lastSampleRef.current = { x: e.clientX, time: now };

    // Fluid drag displacement with soft non-linear resistance
    setDragOffset({
      x: dx * 0.95,
      y: dy * 0.28, // slight vertical fluidity
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const dx = dragOffset.x;
    const absX = Math.abs(dx);
    const absVel = Math.abs(velocity);

    // FLICK THRESHOLD: Dragged over 80px or flicked at velocity > 0.38 px/ms
    if (absX > 80 || absVel > 0.38) {
      const dir: 'left' | 'right' = (dx !== 0 ? dx : velocity) > 0 ? 'right' : 'left';
      setFlingDirection(dir);

      flingTimerRef.current = setTimeout(() => {
        if (dir === 'right') {
          handlePrev();
        } else {
          handleNext();
        }
        setFlingDirection(null);
        setDragOffset({ x: 0, y: 0 });
        setVelocity(0);

        // Landing squish / wobble on arrival of next card
        setIsWobbling(true);
        if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
        wobbleTimerRef.current = setTimeout(() => setIsWobbling(false), 450);
      }, 260);
    } else {
      // SNAP BACK TO CENTER with Organic Liquid Wobble Oscillation
      setDragOffset({ x: 0, y: 0 });
      setIsWobbling(true);
      if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
      wobbleTimerRef.current = setTimeout(() => setIsWobbling(false), 450);
    }
  };

  const current = activeList[activeIdx % total];

  // ── Real Fluid Viscous Calculations ──
  const speedMagnitude = Math.min(1.5, Math.abs(velocity) + Math.abs(dragOffset.x) * 0.003);
  // Volume conservation: Stretch horizontally, compress vertically
  const liquidScaleX = isDragging ? 1 + speedMagnitude * 0.12 : 1;
  const liquidScaleY = isDragging ? 1 / Math.sqrt(liquidScaleX) : 1;
  const dynamicTilt = isDragging ? dragOffset.x * 0.075 : 0;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`h-4 w-4 drop-shadow-[0_1px_2px_rgba(230,175,46,0.3)] transition-colors ${
          i < rating ? 'text-[#D4AF37]' : 'text-slate-200'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <section
      id="testimonials-section"
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden bg-gradient-to-b from-[#F7FBFC] via-[#FFFFFF] to-[#F7FBFC] py-20 sm:py-24 lg:py-28 text-ink"
    >
      {/* ── Background Subtle Glass Ambient Spheres ── */}
      <div
        className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-accent/8 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-[#E3EBF3]/40 blur-[90px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <div className="mb-14 text-center sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/50 px-4 py-1.5 shadow-[0_2px_12px_rgba(20,36,51,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.9)] backdrop-blur-[6px] mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-deep animate-pulse" />
            <span className="font-body text-[11px] font-semibold tracking-[0.24em] text-accent-deep uppercase">
              Client Chronicles
            </span>
          </div>

          <h2
            id="testimonials-heading"
            className="font-display text-3xl font-light tracking-tight text-ink sm:text-4xl lg:text-5xl"
          >
            Memories etched in <span className="italic font-normal font-serif text-accent-deep">light & time</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-body text-xs sm:text-sm text-ink-muted">
            Raw emotions, unscripted glances, and memories preserved for generations. Swipe or drag the cards below.
          </p>
        </div>

        {/* ── Main Apple Optical Glass Monolith Slab ── */}
        <div
          ref={slabRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative overflow-hidden rounded-[2.2rem] border border-white/80 bg-white/45 p-6 sm:p-10 lg:p-12 shadow-[0_24px_64px_rgba(20,36,51,0.08),inset_0_1.5px_2px_rgba(255,255,255,0.95),inset_0_-1px_2px_rgba(255,255,255,0.3)] backdrop-blur-[6px] transition-all duration-300"
        >
          {/* Dynamic Optical Caustic Radial Spotlight */}
          <div
            className="pointer-events-none absolute -inset-px transition-opacity duration-300"
            style={{
              background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.55), transparent 70%)`,
            }}
            aria-hidden="true"
          />

          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {/* ═════════════════════════════════════════════════════════════
                LEFT COLUMN: Kinetic Physical Apple Glass Card Deck
               ═════════════════════════════════════════════════════════════ */}
            <div className="relative flex flex-col items-center justify-center lg:col-span-5 select-none">
              <div
                className="relative h-[340px] w-full max-w-[290px] sm:h-[380px] sm:max-w-[320px] touch-none"
                style={{ perspective: 1000 }}
              >
                {activeList.map((item, index) => {
                  const active = activeIdx % total;
                  const offset = (index - active + total) % total;

                  // Render only top 3 cards in depth
                  if (offset > 2) return null;

                  const isFront = offset === 0;

                  // Transform calculations
                  let transformStyle = '';
                  let opacityStyle = 1;
                  let transitionStyle = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';

                  if (isFront) {
                    if (flingDirection) {
                      const dirMultiplier = flingDirection === 'right' ? 1 : -1;
                      transformStyle = `translate3d(${dirMultiplier * 420}px, 0, 0) rotate(${dirMultiplier * 26}deg) scale(0.85)`;
                      opacityStyle = 0;
                      transitionStyle = 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.26s ease-out';
                    } else if (isDragging) {
                      transformStyle = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dynamicTilt}deg) scale(${liquidScaleX}, ${liquidScaleY})`;
                      opacityStyle = 1;
                      transitionStyle = 'none'; // Instant 1:1 finger tracking
                    } else {
                      transformStyle = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
                      opacityStyle = 1;
                    }
                  } else {
                    // Back cards cascade with physical depth
                    const depthY = offset * -15;
                    const depthScale = 1 - offset * 0.06;
                    const depthRot = offset % 2 === 1 ? 2.5 : -2.5;

                    // When front card is dragged, slightly bring 2nd card forward
                    const dragInfluence = isDragging ? Math.min(1, Math.abs(dragOffset.x) / 140) * 0.03 : 0;
                    transformStyle = `translate3d(0, ${depthY}px, ${-offset * 40}px) scale(${depthScale + dragInfluence}) rotate(${depthRot}deg)`;
                    opacityStyle = offset === 1 ? 0.75 : 0.45;
                  }

                  return (
                    <div
                      key={item._id}
                      onPointerDown={isFront ? handlePointerDown : undefined}
                      onPointerMove={handlePointerMove}
                      onPointerUp={isFront ? handlePointerUp : undefined}
                      onPointerCancel={isFront ? handlePointerUp : undefined}
                      style={{
                        zIndex: 30 - offset * 10,
                        transform: transformStyle,
                        opacity: opacityStyle,
                        transition: transitionStyle,
                      }}
                      className={`absolute inset-0 mx-auto overflow-hidden rounded-[1.6rem] border border-white/90 bg-white shadow-[0_16px_40px_rgba(20,36,51,0.14),inset_0_1.5px_2px_rgba(255,255,255,0.95)] ${
                        isFront
                          ? 'cursor-grab active:cursor-grabbing'
                          : 'pointer-events-none'
                      } ${isFront && isWobbling ? 'animate-water-wobble' : ''}`}
                    >
                      {/* Photo or Studio Monogram */}
                      {item.photo_url ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={item.photo_url}
                            alt={item.client_name}
                            fill
                            className="object-cover pointer-events-none"
                            sizes="(max-width: 768px) 100vw, 360px"
                            priority={isFront}
                            unoptimized
                          />
                          {/* Inner Optical Glass Rim Gradient */}
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/10" />

                          {/* Front Card Badge */}
                          <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/30 bg-black/35 px-3 py-2 backdrop-blur-[4px]">
                            <p className="font-display text-sm font-medium text-white truncate">
                              {item.client_name}
                            </p>
                            <p className="font-body text-[10px] uppercase tracking-wider text-white/80 truncate">
                              {item.event_type}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#142433] to-[#0A121A] p-6 text-center text-white">
                          <span className="font-display text-6xl font-light text-accent-soft/80 mb-2">
                            {item.client_name.charAt(0)}
                          </span>
                          <p className="font-display text-base font-medium">{item.client_name}</p>
                          <p className="font-body text-xs text-white/70 mt-0.5">{item.event_type}</p>
                        </div>
                      )}

                      {/* Optical Glass Shimmer Edge */}
                      <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] ring-1 ring-inset ring-white/60" />
                    </div>
                  );
                })}
              </div>

              {/* Physical Gesture Hint Pill */}
              <div className="mt-5 flex items-center gap-1.5 rounded-full border border-white/90 bg-white/60 px-3.5 py-1 text-[11px] font-medium text-ink-muted shadow-[0_2px_8px_rgba(20,36,51,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-[4px]">
                <svg
                  className="h-3 w-3 text-accent-deep animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Drag or flick card left/right</span>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════
                RIGHT COLUMN: Editorial Quote & Liquid Controls
               ═════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col justify-between lg:col-span-7">
              <div>
                {/* Star Rating & Verified Review Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-1">
                    {renderStars(current.rating)}
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-800 uppercase backdrop-blur-[2px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Verified Experience
                  </div>
                </div>

                {/* Decorative Optical Quotation Mark */}
                <div
                  className="font-serif text-5xl sm:text-6xl text-accent/35 leading-none select-none -mb-3"
                  aria-hidden="true"
                >
                  &ldquo;
                </div>

                {/* Review Text with smooth keyframe animation */}
                <p
                  key={current._id}
                  className="min-h-[110px] sm:min-h-[130px] font-display text-lg sm:text-xl md:text-2xl font-light italic leading-relaxed text-ink/90 animate-fade-in-up"
                >
                  {current.review_text}
                </p>

                {/* Client Metadata */}
                <div className="mt-6 border-t border-ink/8 pt-5">
                  <h3 className="font-display text-xl sm:text-2xl font-normal text-ink">
                    {current.client_name}
                  </h3>
                  <p className="font-body text-xs font-semibold tracking-[0.16em] uppercase text-accent-deep mt-0.5">
                    {current.event_type}
                  </p>
                </div>
              </div>

              {/* ── Liquid Navigation Controls & Capsule Indicator ── */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-ink/8 pt-6">
                {/* Arrow Buttons sculpted in Apple Optical Glass */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous testimonial"
                    className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white/70 text-ink shadow-[0_4px_14px_rgba(20,36,51,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.95)] backdrop-blur-[6px] transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95"
                  >
                    <svg
                      className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next testimonial"
                    className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white/70 text-ink shadow-[0_4px_14px_rgba(20,36,51,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.95)] backdrop-blur-[6px] transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95"
                  >
                    <svg
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Optical Liquid Glass Pill Indicator */}
                <div className="flex items-center gap-1.5 rounded-full border border-white/90 bg-white/60 p-1.5 shadow-[0_2px_8px_rgba(20,36,51,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.9)] backdrop-blur-[6px]">
                  {activeList.map((_, i) => {
                    const isSelected = i === activeIdx % total;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (i === activeIdx % total) return;
                          setActiveIdx(i);
                          setIsWobbling(true);
                          if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
                          wobbleTimerRef.current = setTimeout(() => setIsWobbling(false), 450);
                        }}
                        aria-label={`View testimonial ${i + 1}`}
                        className={`relative h-2 rounded-full transition-all duration-300 ${
                          isSelected
                            ? 'w-7 bg-gradient-to-r from-accent-deep to-accent shadow-[0_2px_8px_rgba(118,159,205,0.4)]'
                            : 'w-2 bg-neutral-300/80 hover:bg-neutral-400'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Keyframe Animations for Water Droplet Physics ── */}
      <style jsx>{`
        @keyframes waterWobble {
          0% {
            transform: scale(1.15, 0.88);
          }
          30% {
            transform: scale(0.9, 1.12);
          }
          55% {
            transform: scale(1.06, 0.95);
          }
          75% {
            transform: scale(0.98, 1.02);
          }
          100% {
            transform: scale(1, 1);
          }
        }
        .animate-water-wobble {
          animation: waterWobble 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </section>
  );
}
