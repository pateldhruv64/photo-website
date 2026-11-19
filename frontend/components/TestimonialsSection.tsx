'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  /** true = placeholder copy, NOT a real client review */
  isPlaceholder?: boolean;
}

interface Props {
  initialTestimonials?: Testimonial[];
}

/**
 * Placeholder reviews. Sirf tab dikhte hain jab DB me real data nahi hota.
 * Launch se pehle inhe apne real clients ke reviews (unki permission ke saath) se replace karo.
 */
const LUXURY_FALLBACKS: Testimonial[] = [
  {
    _id: 'lux-1',
    client_name: 'Aanya & Siddharth',
    event_type: 'ROYAL PALACE WEDDING, UDAIPUR',
    review_text:
      'Nikunj has this extraordinary, quiet intuition for light and intimacy. Looking through our wedding gallery felt like turning the pages of an Italian Vogue editorial. Every tear, every laugh, and every subtle glance was captured with sheer cinematic brilliance.',
    rating: 5,
    photo_url:
      'https://res.cloudinary.com/dkyonzfbo/image/upload/v1783573813/portfolio/f70rmdumjwbcye0d6zn1.jpg',
    is_active: true,
    created_at: '',
    isPlaceholder: true,
  },
  {
    _id: 'lux-2',
    client_name: 'Natasha Malhotra',
    event_type: 'HIGH-FASHION EDITORIAL & PORTRAIT',
    review_text:
      'The lighting direction was utterly world-class. Nikunj crafts atmosphere with Rembrandt-like precision. The final deliverables blew our agency away — immaculate skin texture, rich color grading, and an effortless, high-end fine art aura.',
    rating: 5,
    photo_url:
      'https://res.cloudinary.com/dkyonzfbo/image/upload/v1783573822/portfolio/jrezg1luyga0k9jxcuj0.jpg',
    is_active: true,
    created_at: '',
    isPlaceholder: true,
  },
  {
    _id: 'lux-3',
    client_name: 'Karan & Rhea Singhania',
    event_type: 'SUNSET PRE-WEDDING, GOA',
    review_text:
      'From our golden hour session on the cliffs to the midnight celebrations, Nikunj made us feel completely natural and unposed. He captured moments we did not even know happened. Investing in his lens was the single best decision of our entire wedding.',
    rating: 5,
    photo_url:
      'https://res.cloudinary.com/dkyonzfbo/image/upload/v1783573829/portfolio/osv3wkc1aoglmwmthwdf.jpg',
    is_active: true,
    created_at: '',
    isPlaceholder: true,
  },
];

const isDummyReview = (text?: string) =>
  !text || text.trim().length < 15 || /^[a-z]{4,}$/i.test(text.trim());

// Tunables
const AUTOPLAY_MS = 8000;
const FLING_DISTANCE = 80; // px
const FLING_VELOCITY = 0.38; // px/ms
const FLING_EXIT_MS = 260;
const WOBBLE_MS = 450;

export default function TestimonialsSection({
  initialTestimonials,
}: Props = {}) {
  const { data: testimonials } = useSWR<Testimonial[]>(
    '/testimonials',
    fetcher,
    {
      fallbackData: initialTestimonials,
      revalidateOnFocus: false,
      revalidateOnMount: !initialTestimonials?.length,
      dedupingInterval: 3600000,
    },
  );

  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // ── Drag state (render ke liye) ──
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flingDirection, setFlingDirection] = useState<'left' | 'right' | null>(
    null,
  );
  const [isWobbling, setIsWobbling] = useState(false);
  // Jo card abhi fling hoke gayi, use back me bina "ud ke wapas aaye" ke place karne ke liye
  const [exitingId, setExitingId] = useState<string | null>(null);

  // ── Drag state (refs: stale closure se bachne ke liye) ──
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const lastSampleRef = useRef({ x: 0, time: 0 });
  const velocityRef = useRef(0);

  const wobbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data: real reviews rakho, dummy wale ko placeholder se replace karo ──
  const activeList: Testimonial[] = useMemo(() => {
    const real = (testimonials ?? []).filter((t) => t.is_active);
    if (real.length === 0) return LUXURY_FALLBACKS;

    return real.map((item, idx) => {
      if (!isDummyReview(item.review_text)) return item;
      const fb = LUXURY_FALLBACKS[idx % LUXURY_FALLBACKS.length];
      return {
        ...item,
        client_name: fb.client_name,
        event_type: fb.event_type,
        review_text: fb.review_text,
        photo_url: item.photo_url || fb.photo_url,
        isPlaceholder: true,
      };
    });
  }, [testimonials]);

  const total = activeList.length;
  const safeIdx = total > 0 ? activeIdx % total : 0;
  const current = activeList[safeIdx];

  // ── Helpers ──
  const triggerWobble = useCallback(() => {
    setIsWobbling(true);
    if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
    wobbleTimerRef.current = setTimeout(() => setIsWobbling(false), WOBBLE_MS);
  }, []);

  const handleNext = useCallback(() => {
    if (total === 0) return;
    setActiveIdx((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    setActiveIdx((prev) => (prev - 1 + total) % total);
  }, [total]);

  // prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Autoplay
  useEffect(() => {
    if (isHovered || isDragging || flingDirection || reduceMotion || total <= 1)
      return;
    const timer = setInterval(handleNext, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [isHovered, isDragging, flingDirection, reduceMotion, total, handleNext]);

  // Timers cleanup
  useEffect(() => {
    return () => {
      if (wobbleTimerRef.current) clearTimeout(wobbleTimerRef.current);
      if (flingTimerRef.current) clearTimeout(flingTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  // ── Pointer physics ──
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (flingDirection || total <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);

    startRef.current = { x: e.clientX, y: e.clientY };
    lastSampleRef.current = { x: e.clientX, time: performance.now() };
    velocityRef.current = 0;
    offsetRef.current = { x: 0, y: 0 };
    draggingRef.current = true;

    setIsDragging(true);
    setIsWobbling(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;

    const now = performance.now();
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    // Smoothed velocity (px/ms) — ek noisy sample pe decision nahi hota
    const dt = Math.max(1, now - lastSampleRef.current.time);
    const inst = (e.clientX - lastSampleRef.current.x) / dt;
    velocityRef.current = velocityRef.current * 0.6 + inst * 0.4;
    lastSampleRef.current = { x: e.clientX, time: now };

    const next = { x: dx * 0.95, y: dy * 0.28 };
    offsetRef.current = next;
    setDragOffset(next);
  };

  const finishDrag = (
    e: React.PointerEvent<HTMLDivElement>,
    allowFling: boolean,
  ) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }

    // Agar user ne release se pehle ruk gaya tha, to purani velocity ignore karo
    const idleMs = performance.now() - lastSampleRef.current.time;
    const vel = idleMs > 80 ? 0 : velocityRef.current;
    const dx = offsetRef.current.x;
    const absX = Math.abs(dx);

    const shouldFling =
      allowFling &&
      (absX > FLING_DISTANCE || (Math.abs(vel) > FLING_VELOCITY && absX > 16));

    if (shouldFling && current) {
      const dir: 'left' | 'right' =
        (dx !== 0 ? dx : vel) > 0 ? 'right' : 'left';
      const leavingId = current._id;
      setFlingDirection(dir);

      flingTimerRef.current = setTimeout(() => {
        // Purani card ko pehle bina transition ke back me rakho, phir fade-in
        setExitingId(leavingId);
        setActiveIdx((prev) =>
          dir === 'right' ? (prev - 1 + total) % total : (prev + 1) % total,
        );
        setFlingDirection(null);
        setDragOffset({ x: 0, y: 0 });
        offsetRef.current = { x: 0, y: 0 };
        triggerWobble();

        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        exitTimerRef.current = setTimeout(() => setExitingId(null), 60);
      }, FLING_EXIT_MS);
    } else {
      // Snap back
      setDragOffset({ x: 0, y: 0 });
      offsetRef.current = { x: 0, y: 0 };
      triggerWobble();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) =>
    finishDrag(e, true);
  // Browser ne vertical scroll le liya (touch-pan-y) => fling nahi, bas wapas center
  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) =>
    finishDrag(e, false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
  };

  if (!current) return null;

  // ── Fluid calculations (volume conservation) ──
  const speedMagnitude = Math.min(
    1.5,
    Math.abs(velocityRef.current) + Math.abs(dragOffset.x) * 0.003,
  );
  const liquidScaleX = isDragging ? 1 + speedMagnitude * 0.12 : 1;
  const liquidScaleY = isDragging ? 1 / Math.sqrt(liquidScaleX) : 1;
  const dynamicTilt = isDragging ? dragOffset.x * 0.075 : 0;

  const renderStars = (rating: number) => {
    const r = Math.max(0, Math.min(5, Math.round(rating || 0)));
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`h-4 w-4 drop-shadow-[0_1px_2px_rgba(230,175,46,0.3)] transition-colors ${
          i < r ? 'text-[#D4AF37]' : 'text-slate-200'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
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
      {/* Ambient spheres */}
      <div
        className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-accent/8 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-[#E3EBF3]/40 blur-[90px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="mb-14 text-center sm:mb-16">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/50 px-4 py-1.5 shadow-[0_2px_12px_rgba(20,36,51,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.9)] backdrop-blur-[6px]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-deep" />
            <span className="font-body text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-deep">
              Client Chronicles
            </span>
          </div>

          <h2
            id="testimonials-heading"
            className="font-display text-3xl font-light tracking-tight text-ink sm:text-4xl lg:text-5xl"
          >
            Memories etched in{' '}
            <span className="font-serif font-normal italic text-accent-deep">
              light &amp; time
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-body text-xs text-ink-muted sm:text-sm">
            Raw emotions, unscripted glances, and memories preserved for
            generations. Swipe or drag the cards below.
          </p>
        </div>

        {/* ── Glass slab ── */}
        <div
          role="group"
          aria-roledescription="carousel"
          aria-label="Client testimonials"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerEnter={(e) =>
            e.pointerType === 'mouse' && setIsHovered(true)
          }
          onPointerLeave={(e) =>
            e.pointerType === 'mouse' && setIsHovered(false)
          }
          className="relative overflow-hidden rounded-[2.2rem] border border-white/80 bg-white/45 p-6 shadow-[0_24px_64px_rgba(20,36,51,0.08),inset_0_1.5px_2px_rgba(255,255,255,0.95),inset_0_-1px_2px_rgba(255,255,255,0.3)] backdrop-blur-[6px] outline-none transition-shadow duration-300 focus-visible:ring-2 focus-visible:ring-accent-deep/50 sm:p-10 lg:p-12"
        >
          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {/* ═══ LEFT: Card deck ═══ */}
            <div className="relative flex select-none flex-col items-center justify-center lg:col-span-5">
              <div
                className="relative h-[340px] w-full max-w-[290px] sm:h-[380px] sm:max-w-[320px]"
                style={{ perspective: 1000 }}
              >
                {activeList.map((item, index) => {
                  const offset = (index - safeIdx + total) % total;
                  if (offset > 2) return null;

                  const isFront = offset === 0;
                  const isExiting = item._id === exitingId;

                  let transform = '';
                  let opacity = 1;
                  let transition =
                    'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease';

                  if (isFront) {
                    if (flingDirection) {
                      const d = flingDirection === 'right' ? 1 : -1;
                      transform = `translate3d(${d * 420}px, 0, 0) rotate(${d * 26}deg) scale(0.85)`;
                      opacity = 0;
                      transition = `transform ${FLING_EXIT_MS + 20}ms cubic-bezier(0.25, 1, 0.5, 1), opacity ${FLING_EXIT_MS}ms ease-out`;
                    } else if (isDragging) {
                      transform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dynamicTilt}deg) scale(${liquidScaleX}, ${liquidScaleY})`;
                      transition = 'none'; // 1:1 finger tracking
                    } else {
                      transform = 'translate3d(0, 0, 0) rotate(0deg) scale(1)';
                    }
                  } else {
                    const depthY = offset * -15;
                    const depthScale = 1 - offset * 0.06;
                    const depthRot = offset % 2 === 1 ? 2.5 : -2.5;
                    const dragInfluence = isDragging
                      ? Math.min(1, Math.abs(dragOffset.x) / 140) * 0.03
                      : 0;

                    transform = `translate3d(0, ${depthY}px, ${-offset * 40}px) scale(${depthScale + dragInfluence}) rotate(${depthRot}deg)`;
                    opacity = offset === 1 ? 0.75 : 0.45;

                    if (isExiting) {
                      // Abhi-abhi fling hui card: seedha back me, invisible, phir fade-in
                      opacity = 0;
                      transition = 'none';
                    }
                  }

                  return (
                    /* OUTER: sirf position / drag transform. Isi pe wobble NAHI lagta. */
                    <div
                      key={item._id}
                      onPointerDown={isFront ? handlePointerDown : undefined}
                      onPointerMove={isFront ? handlePointerMove : undefined}
                      onPointerUp={isFront ? handlePointerUp : undefined}
                      onPointerCancel={
                        isFront ? handlePointerCancel : undefined
                      }
                      style={{
                        zIndex: 30 - offset * 10,
                        transform,
                        opacity,
                        transition,
                      }}
                      className={`absolute inset-0 mx-auto will-change-transform ${
                        isFront
                          ? 'cursor-grab touch-pan-y active:cursor-grabbing'
                          : 'pointer-events-none'
                      }`}
                      aria-hidden={!isFront}
                    >
                      {/* INNER: card ka shell + wobble animation (alag element => transform conflict nahi) */}
                      <div
                        className={`relative h-full w-full overflow-hidden rounded-[1.6rem] border border-white/90 bg-white shadow-[0_16px_40px_rgba(20,36,51,0.14),inset_0_1.5px_2px_rgba(255,255,255,0.95)] ${
                          isFront && isWobbling ? 'testi-wobble' : ''
                        }`}
                      >
                        {item.photo_url ? (
                          <div className="relative h-full w-full">
                            <Image
                              src={item.photo_url}
                              alt={item.client_name}
                              fill
                              draggable={false}
                              className="pointer-events-none object-cover"
                              sizes="(max-width: 768px) 100vw, 360px"
                              priority={isFront}
                              unoptimized
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/10" />

                            <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/30 bg-black/35 px-3 py-2 backdrop-blur-[4px]">
                              <p className="truncate font-display text-sm font-medium text-white">
                                {item.client_name}
                              </p>
                              <p className="truncate font-body text-[10px] uppercase tracking-wider text-white/80">
                                {item.event_type}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#142433] to-[#0A121A] p-6 text-center text-white">
                            <span className="mb-2 font-display text-6xl font-light text-accent-soft/80">
                              {item.client_name.charAt(0)}
                            </span>
                            <p className="font-display text-base font-medium">
                              {item.client_name}
                            </p>
                            <p className="mt-0.5 font-body text-xs text-white/70">
                              {item.event_type}
                            </p>
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] ring-1 ring-inset ring-white/60" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {total > 1 && (
                <div className="mt-5 flex items-center gap-1.5 rounded-full border border-white/90 bg-white/60 px-3.5 py-1 text-[11px] font-medium text-ink-muted shadow-[0_2px_8px_rgba(20,36,51,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-[4px]">
                  <svg
                    className="h-3 w-3 text-accent-deep"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  <span>Drag or flick card left/right</span>
                </div>
              )}
            </div>

            {/* ═══ RIGHT: Quote + controls ═══ */}
            <div className="flex flex-col justify-between lg:col-span-7">
              <div>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div
                    className="flex items-center gap-1"
                    role="img"
                    aria-label={`${current.rating} out of 5 stars`}
                  >
                    {renderStars(current.rating)}
                  </div>

                  {/* Verified badge sirf real reviews pe */}
                  {!current.isPlaceholder && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 backdrop-blur-[2px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Verified Experience
                    </div>
                  )}
                </div>

                <div
                  className="-mb-3 select-none font-serif text-5xl leading-none text-accent/35 sm:text-6xl"
                  aria-hidden="true"
                >
                  &ldquo;
                </div>

                <p
                  key={current._id}
                  className="testi-fade-in min-h-[150px] font-display text-lg font-light italic leading-relaxed text-ink/90 sm:min-h-[170px] sm:text-xl md:min-h-[190px] md:text-2xl"
                >
                  {current.review_text}
                </p>

                <div className="mt-6 border-t border-ink/8 pt-5">
                  <h3 className="font-display text-xl font-normal text-ink sm:text-2xl">
                    {current.client_name}
                  </h3>
                  <p className="mt-0.5 font-body text-xs font-semibold uppercase tracking-[0.16em] text-accent-deep">
                    {current.event_type}
                  </p>
                </div>
              </div>

              {/* Controls */}
              {total > 1 && (
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-ink/8 pt-6">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handlePrev}
                      aria-label="Previous testimonial"
                      className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white/70 text-ink shadow-[0_4px_14px_rgba(20,36,51,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.95)] backdrop-blur-[6px] transition-all duration-300 hover:scale-105 hover:bg-white active:scale-95"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      aria-label="Next testimonial"
                      className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white/70 text-ink shadow-[0_4px_14px_rgba(20,36,51,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.95)] backdrop-blur-[6px] transition-all duration-300 hover:scale-105 hover:bg-white active:scale-95"
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full border border-white/90 bg-white/60 p-1.5 shadow-[0_2px_8px_rgba(20,36,51,0.04),inset_0_1px_1.5px_rgba(255,255,255,0.9)] backdrop-blur-[6px]">
                    {activeList.map((item, i) => {
                      const selected = i === safeIdx;
                      return (
                        <button
                          key={item._id}
                          type="button"
                          onClick={() => {
                            if (selected) return;
                            setActiveIdx(i);
                            triggerWobble();
                          }}
                          aria-label={`View testimonial ${i + 1}`}
                          aria-current={selected}
                          className={`relative h-2 rounded-full transition-all duration-300 ${
                            selected
                              ? 'w-7 bg-gradient-to-r from-accent-deep to-accent shadow-[0_2px_8px_rgba(118,159,205,0.4)]'
                              : 'w-2 bg-neutral-300/80 hover:bg-neutral-400'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plain <style> (styled-jsx scoping ka jhanjhat nahi) */}
      <style>{`
        @keyframes testiWobble {
          0%   { transform: scale(1.12, 0.9); }
          30%  { transform: scale(0.93, 1.09); }
          55%  { transform: scale(1.04, 0.97); }
          75%  { transform: scale(0.99, 1.01); }
          100% { transform: scale(1, 1); }
        }
        .testi-wobble {
          animation: testiWobble 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes testiFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .testi-fade-in {
          animation: testiFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .testi-wobble, .testi-fade-in { animation: none; }
        }
      `}</style>
    </section>
  );
}
