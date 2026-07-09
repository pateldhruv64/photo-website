import type { SiteConfig } from '@/lib/types';

/**
 * Get the WhatsApp phone number from the environment variable (override)
 * or fallback to the site config database value.
 */
export function getWhatsAppNumber(config?: SiteConfig | null): string {
  const envNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (envNumber) {
    return envNumber;
  }
  return config?.studio_whatsapp || '';
}

/**
 * Generate a standard WhatsApp link using the resolved number and custom text message.
 */
export function getWhatsAppUrl(config?: SiteConfig | null, text: string = "Hi, I'd like to book a session!"): string {
  const rawNumber = getWhatsAppNumber(config);
  if (!rawNumber) return '';

  const cleanNumber = rawNumber.replace(/[\s\-\+]/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}
