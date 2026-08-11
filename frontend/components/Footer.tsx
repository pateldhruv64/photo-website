'use client';

import Link from 'next/link';
import { useCategories } from '@/lib/hooks';
import type { SiteConfig, Category } from '@/lib/types';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';

interface FooterProps {
  config?: SiteConfig | null;
  categories?: Category[];
}

/* Social icons — ek jagah define, taki markup saaf rahe */
const SOCIALS = {
  instagram: {
    label: 'Instagram',
    hover: 'hover:text-[#E1306C]',
    path: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </>
    ),
    stroke: true,
  },
  facebook: {
    label: 'Facebook',
    hover: 'hover:text-[#1877F2]',
    path: <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />,
    stroke: false,
  },
  youtube: {
    label: 'YouTube',
    hover: 'hover:text-[#FF0000]',
    path: <path d="M23.498 6.163c-.272-1.016-1.071-1.815-2.087-2.087C19.565 3.5 12 3.5 12 3.5s-7.565 0-9.411.576c-1.016.272-1.815 1.071-2.087 2.087C0 8.01 0 12 0 12s0 3.99.502 5.837c.272 1.016 1.071 1.815 2.087 2.087C4.435 20.5 12 20.5 12 20.5s7.565 0 9.411-.576c1.016-.272 1.815-1.071 2.087-2.087C24 15.99 24 12 24 12s0-3.99-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />,
    stroke: false,
  },
} as const;

/**
 * ─────────────────────────────────────────────────────────────────────
 *  FOOTER
 * ─────────────────────────────────────────────────────────────────────
 *  Naya layout: ek bada "let's work together" CTA sabse upar (footer par
 *  pahunchne wala user aksar contact hi dhoond raha hota hai), phir
 *  columns, phir NAP line.
 *
 *  Purane version se kya hata:
 *    - BorderBeam (animated gradient jo hamesha chalta rehta tha)
 *    - framer-motion (sirf icon hover ke liye — ab CSS)
 *    - giant watermark text jo mobile par overflow karta tha
 */
export default function Footer({ config, categories: initialCategories }: FooterProps) {
  const brand = config?.photographer_name || 'Photography Studio';
  const whatsappUrl = getWhatsAppUrl(config);

  const categories = useCategories(initialCategories);
  const collections = (categories || []).slice(0, 6);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const seo = config?.seo;
  const addressLine = [seo?.street_address, seo?.city, seo?.state, seo?.postal_code]
    .filter(Boolean)
    .join(', ');

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-obsidian text-white">
      {/* Static ambient glow — animated nahi, to koi per-frame cost nahi */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(50rem 26rem at 15% 0%, rgba(118,159,205,0.16), transparent 62%), radial-gradient(40rem 22rem at 85% 40%, rgba(185,215,234,0.09), transparent 60%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* ══ CTA band ══ */}
        <div className="flex flex-col gap-8 border-b border-white/10 py-14 md:flex-row md:items-end md:justify-between md:py-20">
          <div>
            <p className="eyebrow text-accent-soft">Let&apos;s create together</p>
            <h2 className="max-w-xl font-display text-3xl font-light leading-[1.12] text-white sm:text-4xl md:text-5xl">
              Have a date in mind?
              <span className="block italic text-white/60">Let&apos;s save it.</span>
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#25D366] px-7 py-4 font-body text-[12px] uppercase tracking-[0.18em] text-white transition-transform duration-300 ease-editorial hover:-translate-y-0.5 sm:py-3.5"
              >
                <WhatsAppIcon size={17} />
                WhatsApp
              </a>
            )}
            <button
              onClick={() => scrollTo('booking-section')}
              className="rounded-full border border-white/25 px-7 py-4 font-body text-[12px] uppercase tracking-[0.18em] text-white transition-colors duration-300 hover:border-white/60 hover:bg-white/5 sm:py-3.5"
            >
              Enquiry form
            </button>
          </div>
        </div>

        {/* ══ Columns ══ */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:grid-cols-4 md:py-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="font-display text-2xl font-light text-white">{brand}</p>
            <p className="mt-2 font-body text-[10px] uppercase tracking-[0.24em] text-accent-soft/80">
              Photography &amp; Visual Stories
            </p>
            {config?.about_text && (
              <p className="mt-4 max-w-xs font-body text-[13px] leading-relaxed text-white/55">
                {config.about_text.slice(0, 140)}
                {config.about_text.length > 140 ? '…' : ''}
              </p>
            )}

            <div className="mt-6 flex items-center gap-2.5">
              {(['instagram', 'facebook', 'youtube'] as const).map((key) => {
                const url = config?.social_links?.[key];
                if (!url) return null;
                const s = SOCIALS[key];
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/70 transition-all duration-300 ease-editorial hover:-translate-y-0.5 hover:bg-white/10 ${s.hover}`}
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill={s.stroke ? 'none' : 'currentColor'}
                      stroke={s.stroke ? 'currentColor' : 'none'}
                      strokeWidth={s.stroke ? 1.7 : 0}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      {s.path}
                    </svg>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Collections */}
          {collections.length > 0 && (
            <nav aria-label="Collections">
              <h3 className="font-body text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">
                Collections
              </h3>
              <ul className="mt-5 space-y-2.5">
                {collections.map((cat) => (
                  <li key={cat._id}>
                    <Link
                      href={`/${cat.slug}`}
                      className="group inline-flex items-center gap-1.5 font-body text-[13px] text-white/75 transition-colors hover:text-accent-soft"
                    >
                      {cat.name}
                      <span
                        aria-hidden
                        className="translate-x-0 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Explore */}
          <nav aria-label="Sections">
            <h3 className="font-body text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">
              Explore
            </h3>
            <ul className="mt-5 space-y-2.5">
              {[
                { label: 'Home', action: scrollTop },
                { label: 'About', action: () => scrollTo('about-section') },
                { label: 'Packages', action: () => scrollTo('pricing-section') },
                { label: 'Reviews', action: () => scrollTo('testimonials-section') },
                { label: 'FAQ', action: () => scrollTo('faq-section') },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={item.action}
                    className="font-body text-[13px] text-white/75 transition-colors hover:text-accent-soft"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="font-body text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">
              Get in touch
            </h3>
            <ul className="mt-5 space-y-2.5 font-body text-[13px]">
              {config?.studio_phone && (
                <li>
                  <a
                    href={`tel:${config.studio_phone.replace(/\s/g, '')}`}
                    className="text-white/75 transition-colors hover:text-accent-soft"
                  >
                    {config.studio_phone}
                  </a>
                </li>
              )}
              {config?.contact_email && (
                <li>
                  <a
                    href={`mailto:${config.contact_email}`}
                    className="break-all text-white/75 transition-colors hover:text-accent-soft"
                  >
                    {config.contact_email}
                  </a>
                </li>
              )}
              {config?.studio_location_url && (
                <li>
                  <a
                    href={config.studio_location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/75 transition-colors hover:text-accent-soft"
                  >
                    Studio on Google Maps ↗
                  </a>
                </li>
              )}
            </ul>

            {seo?.opening_hours && seo.opening_hours.length > 0 && (
              <div className="mt-6">
                <h3 className="font-body text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">
                  Hours
                </h3>
                <ul className="mt-3 space-y-1 font-body text-[13px] text-white/60">
                  {seo.opening_hours.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ══ NAP + legal ══
            Har page par same name/address/phone — Local SEO ka sabse
            bada trust signal consistency hi hai. */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-8 pb-28 sm:pb-24 md:flex-row md:items-center md:justify-between md:pb-8">
          <address className="font-body text-[11px] not-italic leading-relaxed text-white/40">
            <span className="text-white/60">{config?.studio_name || brand}</span>
            {addressLine && <span> · {addressLine}</span>}
          </address>

          <div className="flex items-center gap-5 font-body text-[11px] text-white/40">
            <span>© {new Date().getFullYear()} {brand}</span>
            <button
              onClick={scrollTop}
              className="group inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              Top
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover:-translate-y-0.5"
              >
                ↑
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
