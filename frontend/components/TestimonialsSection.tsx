'use client';

import { useRef } from 'react';
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

export default function TestimonialsSection() {
  const { data: testimonials } = useSWR<Testimonial[]>('/testimonials', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const sectionRef = useRef<HTMLDivElement>(null);

  // Don't render if no testimonials
  if (!testimonials || !Array.isArray(testimonials) || testimonials.length === 0) return null;

  // Filter only active testimonials
  const activeTestimonials = testimonials.filter(t => t.is_active);
  if (activeTestimonials.length === 0) return null;

  // Triplicate or duplicate the list to ensure there's enough items to span the screen and loop seamlessly
  const marqueeItems = [...activeTestimonials, ...activeTestimonials, ...activeTestimonials];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-base ${i < rating ? 'text-[#D4AF37]' : 'text-neutral-200'}`}>
        ★
      </span>
    ));
  };

  return (
    <section
      ref={sectionRef}
      className="pt-8 pb-16 md:pt-12 md:pb-24 bg-white border-t border-border/30 overflow-hidden"
      id="testimonials-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
        <p className="font-body text-[10px] tracking-[0.4em] uppercase text-text-muted mb-3">
          Client Experiences
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-light tracking-wide text-text-primary">
          What Clients Say
        </h2>
      </div>

      {/* Marquee Wrapper with fading edges */}
      <div className="relative w-full overflow-hidden select-none">
        {/* Left edge shadow gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        
        {/* Right edge shadow gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Sliding marquee track */}
        <div className="animate-marquee flex gap-6 py-4">
          {marqueeItems.map((testimonial, index) => (
            <div
              key={`${testimonial._id}-${index}`}
              className="w-[320px] md:w-[380px] flex-shrink-0"
            >
              <TestimonialCard testimonial={testimonial} renderStars={renderStars} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  renderStars,
}: {
  testimonial: Testimonial;
  renderStars: (rating: number) => JSX.Element[];
}) {
  return (
    <div className="bg-[#FAF9F6] rounded-2xl p-8 h-full flex flex-col justify-between border border-[#EAE6DF]/60 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div>
        {/* Rating Stars at the top */}
        <div className="flex gap-0.5 mb-5">
          {renderStars(testimonial.rating)}
        </div>

        {/* Quote symbol */}
        <span className="font-display text-5xl text-[#D4AF37]/25 leading-none block -mt-2 -ml-1 select-none">
          &ldquo;
        </span>

        {/* Review Text */}
        <p className="font-body text-sm md:text-base text-text-primary/95 leading-relaxed italic -mt-4 mb-6">
          {testimonial.review_text}
        </p>
      </div>

      {/* Client Profile details */}
      <div className="flex items-center gap-4 mt-auto border-t border-[#EAE6DF]/50 pt-5">
        {testimonial.photo_url ? (
          <div className="relative w-11 h-11 rounded-full overflow-hidden border border-[#EAE6DF] bg-white flex-shrink-0">
            <Image
              src={testimonial.photo_url}
              alt={testimonial.client_name}
              fill
              className="object-cover"
              sizes="44px"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-11 h-11 rounded-full bg-[#E6E4DD]/60 border border-[#EAE6DF] flex items-center justify-center text-xs font-semibold text-text-muted flex-shrink-0">
            {testimonial.client_name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-text-primary truncate">
            {testimonial.client_name}
          </p>
          <span className="inline-block text-[10px] tracking-wider uppercase text-text-muted font-body mt-0.5">
            {testimonial.event_type}
          </span>
        </div>
      </div>
    </div>
  );
}
