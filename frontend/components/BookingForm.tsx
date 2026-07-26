'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { getWhatsAppNumber } from '@/lib/whatsapp';
import type { SiteConfig } from '@/lib/types';
import ShimmerButton from '@/components/ui/ShimmerButton';

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
    eventType: '',
    eventDate: '',
    message: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitted, setSubmitted] = useState(false);

  const whatsappNumber = getWhatsAppNumber(config);

  // Don't render if no WhatsApp number
  if (!whatsappNumber) return null;

  const cleanNumber = whatsappNumber.replace(/[\s\-\+]/g, '');

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.eventType) newErrors.eventType = 'Event type is required';
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

    // Reset after 5 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', phone: '', eventType: '', eventDate: '', message: '' });
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
      <section className="py-8 md:py-12 bg-surface" id="booking-section">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="font-display text-2xl md:text-3xl font-light text-text-primary mb-3">
            Message Sent!
          </h3>
          <p className="font-body text-sm text-text-muted">
            Your booking request has been sent via WhatsApp. We&apos;ll get back to you soon!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-12 bg-surface" id="booking-section">
      <div className="max-w-xl mx-auto px-4">
        {/* Section Title */}
        <div className="text-center mb-10">
          <p className="font-body text-xs tracking-[0.3em] uppercase text-text-muted mb-3">
            Get in Touch
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-light text-text-primary">
            Book a Session
          </h2>
          <p className="mt-3 font-body text-sm text-text-muted">
            Fill the form below and we&apos;ll connect on WhatsApp
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label htmlFor="booking-name" className="block font-body text-sm font-medium text-text-primary mb-1.5">
              Full Name *
            </label>
            <input
              id="booking-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Your full name"
              className={`w-full px-4 py-3 font-body text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#B5784A]/30 transition-all ${
                errors.name ? 'border-red-400' : 'border-border'
              }`}
            />
            {errors.name && <p className="mt-1 font-body text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="booking-phone" className="block font-body text-sm font-medium text-text-primary mb-1.5">
              Phone Number *
            </label>
            <input
              id="booking-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+91 98765 43210"
              className={`w-full px-4 py-3 font-body text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#B5784A]/30 transition-all ${
                errors.phone ? 'border-red-400' : 'border-border'
              }`}
            />
            {errors.phone && <p className="mt-1 font-body text-xs text-red-500">{errors.phone}</p>}
          </div>

          {/* Event Type */}
          <div>
            <label htmlFor="booking-event-type" className="block font-body text-sm font-medium text-text-primary mb-1.5">
              Event Type *
            </label>
            <select
              id="booking-event-type"
              value={formData.eventType}
              onChange={(e) => handleChange('eventType', e.target.value)}
              className={`w-full px-4 py-3 font-body text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#B5784A]/30 transition-all appearance-none ${
                errors.eventType ? 'border-red-400' : 'border-border'
              } ${!formData.eventType ? 'text-text-muted' : 'text-text-primary'}`}
            >
              <option value="">Select event type</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.eventType && <p className="mt-1 font-body text-xs text-red-500">{errors.eventType}</p>}
          </div>

          {/* Event Date */}
          <div>
            <label htmlFor="booking-date" className="block font-body text-sm font-medium text-text-primary mb-1.5">
              Event Date *
            </label>
            <input
              id="booking-date"
              type="date"
              value={formData.eventDate}
              onChange={(e) => handleChange('eventDate', e.target.value)}
              className={`w-full px-4 py-3 font-body text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#B5784A]/30 transition-all ${
                errors.eventDate ? 'border-red-400' : 'border-border'
              }`}
            />
            {errors.eventDate && <p className="mt-1 font-body text-xs text-red-500">{errors.eventDate}</p>}
          </div>

          {/* Message */}
          <div>
            <label htmlFor="booking-message" className="block font-body text-sm font-medium text-text-primary mb-1.5">
              Message <span className="text-text-muted">(Optional)</span>
            </label>
            <textarea
              id="booking-message"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Any additional details..."
              rows={3}
              className="w-full px-4 py-3 font-body text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#B5784A]/30 transition-all resize-none"
            />
          </div>

          {/* Submit with Inspira UI ShimmerButton */}
          <ShimmerButton
            type="submit"
            className="w-full py-4 bg-[#1E1410] text-white font-body text-sm font-medium rounded-full shadow-lg hover:bg-[#2C1F18]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
            <span>Send via WhatsApp</span>
          </ShimmerButton>
        </form>
      </div>
    </section>
  );
}
