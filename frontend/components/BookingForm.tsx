'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { fetcher } from '@/lib/fetcher';
import { getWhatsAppNumber } from '@/lib/whatsapp';
import type { SiteConfig } from '@/lib/types';
import ShimmerButton from '@/components/ui/ShimmerButton';
import BorderBeam from '@/components/ui/BorderBeam';

interface FormData {
  name: string;
  phone: string;
  eventType: string;
  eventDate: string;
  message: string;
}

const EVENT_TYPES = [
  'Wedding',
  'Pre-Wedding',
  'Birthday',
  'Corporate',
  'Other',
];

export default function BookingForm() {
  const { data: config } = useSWR<SiteConfig>('/config', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    eventType: 'Wedding',
    eventDate: '',
    message: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitted, setSubmitted] = useState(false);

  const whatsappNumber = getWhatsAppNumber(config);

  if (!whatsappNumber) return null;

  const cleanNumber = whatsappNumber.replace(/[\s\-\+]/g, '');

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.eventType) newErrors.eventType = 'Please select an event type';
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const whatsappMessage = `Hi! I'd like to book a photography session 📸
Name: ${formData.name}
Phone: ${formData.phone}
Event: ${formData.eventType}
Date: ${formData.eventDate}${formData.message ? `\nMessage: ${formData.message}` : ''}`;

    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/${cleanNumber}?text=${encodedMessage}`, '_blank');

    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', phone: '', eventType: 'Wedding', eventDate: '', message: '' });
    }, 5000);
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (submitted) {
    return (
      <section className="py-16 md:py-24 bg-surface" id="booking-section">
        <div className="max-w-xl mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-[#25D366] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
          <h3 className="font-display text-3xl md:text-4xl font-light text-text-primary mb-3">
            Message Sent!
          </h3>
          <p className="font-body text-base text-text-muted">
            Your booking request has been sent via WhatsApp. We&apos;ll connect with you right away!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-14 md:py-24 bg-surface relative overflow-hidden" id="booking-section">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-14 flex flex-col items-center">
          <p className="eyebrow justify-center mb-2">
            Get in Touch
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-text-primary">
            Book a Session
          </h2>
          <p className="mt-3 font-body text-sm md:text-base text-text-muted max-w-md">
            Fill out your event details below and we&apos;ll connect directly via WhatsApp
          </p>
          <div className="divider-line mx-auto mt-6 max-w-[80px]" />
        </div>

        {/* 2-Column Layout: Left Studio Info Card + Right Booking Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Info Card */}
          <div className="lg:col-span-5 relative rounded-3xl bg-[#1E1410] text-white p-8 sm:p-10 shadow-2xl border border-white/10 overflow-hidden flex flex-col justify-between min-h-[480px]">
            {/* Inspira Border Beam */}
            <BorderBeam size={200} duration={7} colorFrom="#B5784A" colorTo="#FFFFFF" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>

              <h3 className="font-display text-3xl font-light text-white mb-3">
                Let&apos;s Create Something Beautiful
              </h3>
              <p className="font-body text-sm text-white/70 leading-relaxed mb-8">
                Have questions about availability, pricing, or custom packages? Send us a quick note and let&apos;s capture your precious moments.
              </p>

              {/* Badges */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse" />
                  <span>Available for Bookings</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Quick response on WhatsApp</span>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Callout */}
            <div className="mt-10 pt-6 border-t border-white/10">
              <p className="font-body text-xs uppercase tracking-widest text-white/50 mb-2">
                Direct Contact
              </p>
              <a
                href={`https://wa.me/${cleanNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-xl text-amber-300 hover:underline flex items-center gap-2"
              >
                <span>+{cleanNumber}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7 bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-border shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Event Type Interactive Pills */}
              <div>
                <label className="block font-body text-xs tracking-wider uppercase text-text-muted font-semibold mb-3">
                  1. Select Event Type *
                </label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map((type) => {
                    const isSelected = formData.eventType === type;
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => handleChange('eventType', type)}
                        className={`px-4 py-2.5 rounded-full text-xs font-medium tracking-wide uppercase transition-all duration-300 ${
                          isSelected
                            ? 'bg-[#1E1410] text-white shadow-md scale-105'
                            : 'bg-[#EAE3D9]/60 text-[#7A6555] hover:bg-[#EAE3D9] hover:text-[#1E1410]'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
                {errors.eventType && <p className="mt-1.5 font-body text-xs text-red-500">{errors.eventType}</p>}
              </div>

              {/* Full Name & Phone in 2-Cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="booking-name" className="block font-body text-xs tracking-wider uppercase text-text-muted font-semibold mb-2">
                    2. Full Name *
                  </label>
                  <input
                    id="booking-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Your full name"
                    className={`w-full px-4 py-3.5 font-body text-sm border rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#B5784A] transition-all shadow-xs ${
                      errors.name ? 'border-red-400' : 'border-border'
                    }`}
                  />
                  {errors.name && <p className="mt-1.5 font-body text-xs text-red-500">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="booking-phone" className="block font-body text-xs tracking-wider uppercase text-text-muted font-semibold mb-2">
                    3. Phone Number *
                  </label>
                  <input
                    id="booking-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`w-full px-4 py-3.5 font-body text-sm border rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#B5784A] transition-all shadow-xs ${
                      errors.phone ? 'border-red-400' : 'border-border'
                    }`}
                  />
                  {errors.phone && <p className="mt-1.5 font-body text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>

              {/* Event Date */}
              <div>
                <label htmlFor="booking-date" className="block font-body text-xs tracking-wider uppercase text-text-muted font-semibold mb-2">
                  4. Event Date *
                </label>
                <input
                  id="booking-date"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => handleChange('eventDate', e.target.value)}
                  className={`w-full px-4 py-3.5 font-body text-sm border rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#B5784A] transition-all shadow-xs ${
                    errors.eventDate ? 'border-red-400' : 'border-border'
                  }`}
                />
                {errors.eventDate && <p className="mt-1.5 font-body text-xs text-red-500">{errors.eventDate}</p>}
                {!errors.eventDate && (
                  <p className="mt-1.5 font-body text-xs text-text-muted/60 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Weekends fill fast — book early for your preferred date!
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="booking-message" className="block font-body text-xs tracking-wider uppercase text-text-muted font-semibold mb-2">
                  5. Additional Details <span className="font-normal text-text-muted/70">(Optional)</span>
                </label>
                <textarea
                  id="booking-message"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  placeholder="Location, estimated guest count, or special requests..."
                  rows={3}
                  className="w-full px-4 py-3.5 font-body text-sm border border-border rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#B5784A] transition-all resize-none shadow-xs"
                />
              </div>

              {/* Submit ShimmerButton */}
              <ShimmerButton
                type="submit"
                className="w-full py-4 bg-[#1E1410] text-white font-body text-sm font-medium rounded-full shadow-xl hover:bg-[#2C1F18]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
                <span>Send via WhatsApp</span>
              </ShimmerButton>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
