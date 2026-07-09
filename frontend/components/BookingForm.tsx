'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { getWhatsAppNumber } from '@/lib/whatsapp';
import type { SiteConfig } from '@/lib/types';

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
      <section className="py-16 md:py-24 bg-surface" id="booking-section">
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
    <section className="py-16 md:py-24 bg-surface" id="booking-section">
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
              className={`w-full px-4 py-3 font-body text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 transition-all ${
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
              className={`w-full px-4 py-3 font-body text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 transition-all ${
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
              className={`w-full px-4 py-3 font-body text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 transition-all appearance-none ${
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
              className={`w-full px-4 py-3 font-body text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 transition-all ${
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
              className="w-full px-4 py-3 font-body text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#1A1A1A] text-white font-body text-sm font-medium rounded-lg hover:bg-gray-800 active:scale-[0.99] transition-all duration-200"
          >
            Send via WhatsApp
          </button>
        </form>
      </div>
    </section>
  );
}
