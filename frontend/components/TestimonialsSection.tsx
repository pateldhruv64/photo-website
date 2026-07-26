'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function TestimonialsSection() {
  const { data: testimonials } = useSWR<Testimonial[]>('/testimonials', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const [activeIdx, setActiveIdx] = useState(0);

  if (!testimonials || !Array.isArray(testimonials) || testimonials.length === 0) return null;

  const activeTestimonials = testimonials.filter((t) => t.is_active);
  if (activeTestimonials.length === 0) return null;

  const current = activeTestimonials[activeIdx % activeTestimonials.length];

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % activeTestimonials.length);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + activeTestimonials.length) % activeTestimonials.length);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < rating ? 'text-amber-400' : 'text-neutral-300'}`}>
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

        {/* Inspira UI Animated Testimonials Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center bg-white/70 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border border-border shadow-xl relative">
          
          {/* Photo Stack Container */}
          <div className="relative h-72 sm:h-80 w-full flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              {activeTestimonials.map((testimonial, index) => {
                const isCurrent = index === activeIdx % activeTestimonials.length;
                const offset = (index - (activeIdx % activeTestimonials.length) + activeTestimonials.length) % activeTestimonials.length;
                
                if (offset > 2) return null;

                return (
                  <motion.div
                    key={testimonial._id}
                    initial={{ opacity: 0, scale: 0.9, rotate: Math.random() * 10 - 5 }}
                    animate={{
                      opacity: isCurrent ? 1 : 0.7 - offset * 0.2,
                      scale: 1 - offset * 0.06,
                      zIndex: activeTestimonials.length - offset,
                      rotate: isCurrent ? 0 : (index % 2 === 0 ? 4 : -4) * offset,
                      y: offset * 12,
                    }}
                    exit={{ opacity: 0, scale: 0.8, rotate: Math.random() * 20 - 10 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="absolute inset-0 max-w-[280px] sm:max-w-[320px] mx-auto h-[320px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white"
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
                      <div className="w-full h-full bg-[#1E1410] flex flex-col items-center justify-center text-white p-6 text-center">
                        <span className="font-display text-5xl font-light mb-2">
                          {testimonial.client_name.charAt(0)}
                        </span>
                        <p className="font-body text-sm text-white/70">{testimonial.client_name}</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Testimonial Quote Content */}
          <div className="flex flex-col justify-between h-full py-2">
            <div>
              <div className="flex items-center gap-1 mb-4">
                {renderStars(current.rating)}
              </div>

              <span className="font-display text-6xl text-[#B5784A]/30 leading-none block -mb-4 select-none">
                &ldquo;
              </span>

              <AnimatePresence mode="wait">
                <motion.p
                  key={current._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="font-display text-lg sm:text-xl text-[#1E1410] leading-relaxed italic mb-6"
                >
                  {current.review_text}
                </motion.p>
              </AnimatePresence>
            </div>

            <div>
              <p className="font-display text-xl font-medium text-[#1E1410]">
                {current.client_name}
              </p>
              <span className="inline-block text-xs tracking-widest uppercase text-[#B5784A] font-body mt-0.5 font-semibold">
                {current.event_type}
              </span>

              {/* Navigation Controls */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full border border-border bg-white hover:bg-[#1E1410] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                  aria-label="Previous testimonial"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full border border-border bg-white hover:bg-[#1E1410] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                  aria-label="Next testimonial"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
