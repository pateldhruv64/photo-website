'use client';

import { useState, useEffect, useCallback } from 'react';
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
  /* Server se aa chuke hain (/api/homepage me shaamil) — SWR sirf
     background refresh ke liye hai. Pehle yeh ek alag client round-trip
     tha aur section tab tak khaali dikhta tha. */
  initialTestimonials?: Testimonial[];
}

export default function TestimonialsSection({ initialTestimonials }: Props = {}) {
  const { data: testimonials } = useSWR<Testimonial[]>('/testimonials', fetcher, {
    fallbackData: initialTestimonials,
    revalidateOnFocus: false,
    revalidateOnMount: !initialTestimonials?.length,
    dedupingInterval: 3600000,
  });

  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const activeTestimonials = testimonials?.filter((t) => t.is_active) || [];

  const handleNext = useCallback(() => {
    if (activeTestimonials.length === 0) return;
    setActiveIdx((prev) => (prev + 1) % activeTestimonials.length);
  }, [activeTestimonials.length]);

  const handlePrev = useCallback(() => {
    if (activeTestimonials.length === 0) return;
    setActiveIdx((prev) => (prev - 1 + activeTestimonials.length) % activeTestimonials.length);
  }, [activeTestimonials.length]);

  /* Auto-swipe. Pehle yeh 1.5 second par tha — ek review padhne me
     hi 6–8 second lagte hain, to slide badal jaati thi aur user
     chid jaata tha. 7s me aaram se padha jaata hai. */
  useEffect(() => {
    if (isHovered || activeTestimonials.length <= 1) return;
    const timer = setInterval(handleNext, 7000);
    return () => clearInterval(timer);
  }, [isHovered, activeTestimonials.length, handleNext]);

  if (!testimonials || !Array.isArray(testimonials) || testimonials.length === 0) return null;
  if (activeTestimonials.length === 0) return null;

  const current = activeTestimonials[activeIdx % activeTestimonials.length];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < rating ? 'text-accent-soft' : 'text-neutral-300'}`}>
        ★
      </span>
    ));
  };

  return (
    <section className="py-14 md:py-20 bg-surface relative overflow-hidden" id="testimonials-section">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 flex flex-col items-center">
          <p className="eyebrow justify-center mb-2">
            Client Experiences
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-text-primary">
            What Clients Say
          </h2>
          <div className="divider-line mx-auto mt-4 max-w-[80px]" />
        </div>

        {/* Inspira UI Animated Testimonials Stack with Auto-Swipe */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center bg-white/70 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-border shadow-xl relative"
        >
          
          {/* Photo Stack Container */}
          <div className="relative flex h-72 w-full items-center justify-center sm:h-80">
            {activeTestimonials.map((testimonial, index) => {
              // offset 0 = sabse aage wala card, 1/2 = peeche wale
              const active = activeIdx % activeTestimonials.length;
              const offset =
                (index - active + activeTestimonials.length) % activeTestimonials.length;

              // Sirf 3 cards render karo — baaki dikhte hi nahi
              if (offset > 2) return null;

              return (
                  <div
                    key={testimonial._id}
                    /* Card stack — pehle framer-motion spring se position
                       hoti thi. Ab offset se seedhe transform: front card
                       poora size, peeche wale chhote aur halke. CSS
                       transition smoothing kar deti hai. */
                    style={{
                      zIndex: 30 - offset * 10,
                      transform: `translateY(${offset * -14}px) scale(${1 - offset * 0.06}) rotate(${offset === 0 ? 0 : offset % 2 ? 3 : -3}deg)`,
                      opacity: offset === 0 ? 1 : 0.55 - offset * 0.15,
                    }}
                    className="absolute inset-0 mx-auto h-[320px] max-w-[280px] overflow-hidden rounded-2xl border-4 border-white bg-white shadow-2xl transition-all duration-700 ease-editorial sm:max-w-[320px]"
                  >
                    {testimonial.photo_url ? (
                      <Image
                        src={testimonial.photo_url}
                        alt={testimonial.client_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-[#142433] flex flex-col items-center justify-center text-white p-6 text-center">
                        <span className="font-display text-5xl font-light mb-2">
                          {testimonial.client_name.charAt(0)}
                        </span>
                        <p className="font-body text-sm text-white/70">{testimonial.client_name}</p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Testimonial Quote Content */}
          <div className="flex flex-col justify-between h-full py-2">
            <div>
              <div className="flex items-center gap-1 mb-4">
                {renderStars(current.rating)}
              </div>

              <span className="font-display text-6xl text-[#769FCD]/30 leading-none block -mb-4 select-none">
                &ldquo;
              </span>

              {/* key badalne par remount hota hai, jisse CSS fade-in
                  har naye review par dobara chalti hai */}
              <p
                key={current._id}
                className="mb-6 min-h-[80px] animate-fade-in-up font-display text-lg italic leading-relaxed text-ink sm:text-xl"
              >
                {current.review_text}
              </p>
            </div>

            <div>
              <p className="font-display text-xl font-medium text-[#142433]">
                {current.client_name}
              </p>
              <span className="inline-block text-xs tracking-widest uppercase text-[#769FCD] font-body mt-0.5 font-semibold">
                {current.event_type}
              </span>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrev}
                    className="w-10 h-10 rounded-full border border-border bg-white hover:bg-[#142433] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                    aria-label="Previous testimonial"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-10 h-10 rounded-full border border-border bg-white hover:bg-[#142433] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                    aria-label="Next testimonial"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Progress indicator dots */}
                <div className="flex items-center gap-1.5">
                  {activeTestimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === activeIdx % activeTestimonials.length
                          ? 'w-6 bg-[#769FCD]'
                          : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
