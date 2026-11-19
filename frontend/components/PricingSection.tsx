'use client';

import { useState, useRef } from 'react';
import TiltCard from '@/components/ui/TiltCard';
import { useSiteConfig } from '@/lib/hooks';
import { getWhatsAppUrl } from '@/lib/whatsapp';

type PricingCategory = 'weddings' | 'portraits';

interface PackageItem {
  id: string;
  name: string;
  tier: string;
  price: string;
  duration: string;
  photos: string;
  features: string[];
  highlight: boolean;
  tagline: string;
}

const WEDDING_PACKAGES: PackageItem[] = [
  {
    id: 'wed-silver',
    name: 'Silver Heritage',
    tier: 'INTIMATE OCCASIONS',
    price: '₹25,000',
    duration: '4 Hours Coverage',
    photos: '150 Master Color-Graded Photos',
    tagline: 'Ideal for intimate engagement ceremonies, Haldi, or Mehendi celebrations.',
    features: [
      'Single Senior Lead Photographer',
      'High-Speed RAW Tethering & Color Grading',
      'Private Password-Protected Online Gallery',
      'Curated Sneak Peek within 48 Hours',
      'High-Resolution Digital Download',
    ],
    highlight: false,
  },
  {
    id: 'wed-gold',
    name: 'Gold Signature',
    tier: 'THE MASTER COLLECTION',
    price: '₹55,000',
    duration: 'Full Day Comprehensive',
    photos: '350+ Master Color-Graded Photos',
    tagline: 'Our signature full-day wedding journey capturing every tear, laughter, and vow.',
    features: [
      'Two Senior Photographers (Candid + Traditional)',
      'Aerial Drone Perspectives (Weather Permitting)',
      'Pre-Wedding Golden Hour Couple Session',
      'Hand-Bound 30-Page Fine-Art Heirloom Album',
      'Complete Raw Archive Delivery on Custom Wooden USB',
      'Express Delivery within 10 Days',
    ],
    highlight: true,
  },
  {
    id: 'wed-platinum',
    name: 'Royal Monolith',
    tier: 'DESTINATION GRANDEUR',
    price: '₹95,000',
    duration: 'Multi-Day Destination Coverage',
    photos: 'Unlimited Curated Master Captures',
    tagline: 'Uncompromising luxury coverage for destination weddings across palaces & private estates.',
    features: [
      'Full 4-Member Cinema & Photography Crew',
      'Multi-Day Coverage (Mehendi, Sangeet, Wedding, Reception)',
      'Same-Day Editorial Motion Highlights Reel',
      'Two Italian Handcrafted Leather Album Keepsakes',
      'Dedicated Lighting Director & Assistant',
      'Personal Pre-Wedding Scouting & Wardrobe Consultation',
    ],
    highlight: false,
  },
];

const PORTRAIT_PACKAGES: PackageItem[] = [
  {
    id: 'port-monologue',
    name: 'Studio Monologue',
    tier: 'SOLO / EXECUTIVE',
    price: '₹12,000',
    duration: '90 Minutes In-Studio',
    photos: '25 Retouched Master Portraits',
    tagline: 'Refined editorial portraits for actors, corporate leaders, and artists.',
    features: [
      'Single Studio Lighting Setup',
      '2 Wardrobe & Look Changes',
      'Full Commercial & Social Media Usage Rights',
      'Magazine-Grade Skin Frequency Separation',
      'Digital Delivery within 5 Days',
    ],
    highlight: false,
  },
  {
    id: 'port-editorial',
    name: 'Haute Editorial',
    tier: 'SIGNATURE LOOKBOOK',
    price: '₹22,000',
    duration: '3.5 Hours On-Location / Studio',
    photos: '60 Master Retouched Portraits',
    tagline: 'Fashion-forward portraiture sculpted with dramatic Rembrandt and cinematic light.',
    features: [
      'Multiple Studio Lighting & Outdoor Location Setups',
      'Up to 4 Wardrobe & Moodboard Looks',
      'Creative Lighting Director & Moodboard Consultation',
      '16-Bit ProPhoto RGB Print-Ready Files',
      'Curated 15-Second Motion Portrait Reel Included',
    ],
    highlight: true,
  },
  {
    id: 'port-campaign',
    name: 'Brand Campaign',
    tier: 'COMMERCIAL COUTURE',
    price: '₹38,000',
    duration: 'Full Day Production',
    photos: '120+ Campaign Master Assets',
    tagline: 'End-to-end commercial lookbooks for designer labels, jewelry houses, and brands.',
    features: [
      'Full Production Day with Tethered Live Monitors',
      'Unlimited Outfit Changes & Set Staging',
      'Comprehensive High-End Retouching for Billboards & Print',
      'Pre-Production Location Scouting & Model Coordination',
      'Full Archival Commercial Copyright Release',
    ],
    highlight: false,
  },
];

export default function PricingSection() {
  const [category, setCategory] = useState<PricingCategory>('weddings');
  const [isWobbling, setIsWobbling] = useState(false);
  const wobbleTimer = useRef<NodeJS.Timeout | null>(null);

  const config = useSiteConfig();

  const packages = category === 'weddings' ? WEDDING_PACKAGES : PORTRAIT_PACKAGES;

  const handleCategorySwitch = (cat: PricingCategory) => {
    if (cat === category) return;
    setCategory(cat);
    setIsWobbling(true);
    if (wobbleTimer.current) clearTimeout(wobbleTimer.current);
    wobbleTimer.current = setTimeout(() => setIsWobbling(false), 450);
  };

  const scrollToBooking = (pkgName: string) => {
    // If WhatsApp is configured, create direct inquiry link with package name
    const inquiryText = `Hi Nikunj, I'm interested in booking the "${pkgName}" package (${category === 'weddings' ? 'Weddings' : 'Portraits'}). Could you check available dates?`;
    const directUrl = getWhatsAppUrl(config, inquiryText);
    if (directUrl) {
      window.open(directUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    // Fallback: smooth scroll to booking form
    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="pricing-section"
      aria-labelledby="pricing-heading"
      className="relative overflow-hidden bg-gradient-to-b from-[#F7FBFC] via-[#FFFFFF] to-[#F7FBFC] py-16 md:py-24 lg:py-28 text-ink"
    >
      {/* ── Ambient Liquid Caustics Glow Behind Section ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[850px] rounded-full bg-[radial-gradient(circle_at_center,rgba(118,159,205,0.18)_0%,rgba(214,230,242,0.12)_45%,transparent_70%)] blur-[120px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <div className="mx-auto max-w-2xl text-center mb-10 sm:mb-14">
          <p className="eyebrow mb-2 justify-center text-accent-deep">
            Investment &amp; Curated Collections
          </p>
          <h2
            id="pricing-heading"
            className="font-display text-3xl font-light tracking-tight text-ink sm:text-4xl md:text-5xl"
          >
            Artisanal Craft. <span className="italic text-ink-soft">Transparent Investment.</span>
          </h2>
          <p className="mt-3.5 font-body text-sm leading-relaxed text-ink-muted sm:text-base">
            Every celebration holds an unrepeatable rhythm. Select your creative scope below or let us tailor a bespoke commission for your dates.
          </p>

          {/* ─── Apple Water Droplet Category Switcher ─── */}
          <div className="mt-8 flex justify-center">
            <div
              role="tablist"
              aria-label="Select photography category"
              className="relative inline-flex items-center rounded-full p-1.5 border border-white/60 bg-white/40 shadow-[0_8px_28px_-6px_rgba(20,36,51,0.08),inset_0_1.5px_2px_rgba(255,255,255,0.9)] backdrop-blur-[6px]"
            >
              {/* The Fluid Sliding Liquid Water Droplet Knob */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute top-1.5 bottom-1.5 rounded-full transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isWobbling ? 'animate-water-wobble' : ''
                }`}
                style={{
                  left: category === 'weddings' ? '6px' : 'calc(50% + 2px)',
                  width: 'calc(50% - 8px)',
                  background:
                    'radial-gradient(110% 110% at 32% 24%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.65) 55%, rgba(255, 255, 255, 0.40) 100%)',
                  boxShadow:
                    '0 4px 16px rgba(20,36,51,0.12), inset 0 2px 2px rgba(255,255,255,1), inset 0 -1.5px 2px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.9)',
                }}
              />

              <button
                type="button"
                role="tab"
                aria-selected={category === 'weddings'}
                onClick={() => handleCategorySwitch('weddings')}
                className={`relative z-10 rounded-full px-5 py-2 font-body text-xs uppercase tracking-[0.18em] transition-colors duration-200 active:scale-95 ${
                  category === 'weddings' ? 'font-bold text-ink' : 'font-medium text-ink-muted hover:text-ink'
                }`}
              >
                Weddings &amp; Events
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={category === 'portraits'}
                onClick={() => handleCategorySwitch('portraits')}
                className={`relative z-10 rounded-full px-5 py-2 font-body text-xs uppercase tracking-[0.18em] transition-colors duration-200 active:scale-95 ${
                  category === 'portraits' ? 'font-bold text-ink' : 'font-medium text-ink-muted hover:text-ink'
                }`}
              >
                Portraits &amp; Editorial
              </button>
            </div>
          </div>
        </div>

        {/* ─── Apple Liquid Glass Slabs Grid ─── */}
        <div className="grid grid-cols-1 gap-7 sm:gap-8 md:grid-cols-3 items-stretch">
          {packages.map((pkg) => {
            const isCenter = pkg.highlight;

            return (
              <TiltCard
                key={pkg.id}
                maxTilt={5}
                spotlightColor={isCenter ? 'rgba(255, 255, 255, 0.22)' : 'rgba(118, 159, 205, 0.16)'}
                className={`group relative flex flex-col justify-between rounded-3xl p-7 sm:p-8 transition-all duration-500 will-change-transform ${
                  isCenter
                    ? 'bg-[#0E1F30]/85 text-white shadow-[0_28px_64px_-12px_rgba(14,31,48,0.45)] md:-translate-y-2 md:scale-[1.03]'
                    : 'bg-white/60 text-ink shadow-[0_12px_36px_-10px_rgba(20,36,51,0.08)] hover:shadow-[0_24px_50px_-12px_rgba(20,36,51,0.18)]'
                }`}
              >
                {/* ── Liquid Optical Glass Refraction Backing ── */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 rounded-3xl backdrop-blur-[6px] backdrop-saturate-[180%] ${
                    isCenter
                      ? 'border border-white/30 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.5),inset_0_-1.5px_2px_rgba(0,0,0,0.4)]'
                      : 'border border-white/80 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-1px_1.5px_rgba(0,0,0,0.05)]'
                  }`}
                />

                {/* Ambient Highlight Sheen along top edge */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-3xl bg-gradient-to-b ${
                    isCenter ? 'from-white/[0.12] to-transparent' : 'from-white/[0.45] to-transparent'
                  }`}
                />

                {/* ── Card Content ── */}
                <div className="relative z-10">
                  {/* Top Tier Badge */}
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={`font-mono text-[9px] uppercase tracking-[0.24em] font-semibold ${
                        isCenter ? 'text-accent-soft' : 'text-accent-deep'
                      }`}
                    >
                      {pkg.tier}
                    </span>

                    {isCenter && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 font-body text-[9px] font-bold tracking-[0.2em] uppercase text-white backdrop-blur-md shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                        <span>SIGNATURE PICK</span>
                      </span>
                    )}
                  </div>

                  {/* Package Title */}
                  <h3
                    className={`font-display text-2xl font-normal tracking-tight sm:text-3xl ${
                      isCenter ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {pkg.name}
                  </h3>

                  {/* Tagline Description */}
                  <p
                    className={`mt-2 font-body text-xs leading-relaxed ${
                      isCenter ? 'text-white/75' : 'text-ink-muted'
                    }`}
                  >
                    {pkg.tagline}
                  </p>

                  {/* Price Block with Tabular Alignment */}
                  <div className="mt-6 flex items-baseline gap-1">
                    <span
                      className={`font-display text-4xl sm:text-5xl font-light tracking-tight tabular ${
                        isCenter ? 'text-white' : 'text-ink'
                      }`}
                    >
                      {pkg.price}
                    </span>
                    <span
                      className={`font-body text-xs tracking-wider uppercase ${
                        isCenter ? 'text-white/60' : 'text-ink-muted'
                      }`}
                    >
                      / collection
                    </span>
                  </div>

                  {/* Coverage Meta */}
                  <div
                    className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-mono ${
                      isCenter ? 'bg-white/10 text-white/90' : 'bg-surface-alt/70 text-ink-soft'
                    }`}
                  >
                    <span>{pkg.duration}</span>
                    <span className="h-1 w-1 rounded-full bg-current opacity-40" />
                    <span>{pkg.photos}</span>
                  </div>

                  {/* Hairline Divider */}
                  <div
                    className={`my-6 border-t ${
                      isCenter ? 'border-white/15' : 'border-line/70'
                    }`}
                  />

                  {/* Deliverables List */}
                  <ul className="space-y-3 font-body text-[13px]">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full mt-0.5 ${
                            isCenter ? 'bg-accent/25 text-accent-soft' : 'bg-accent-tint text-accent-deep'
                          }`}
                        >
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 3.5 6.5 9 1" />
                          </svg>
                        </span>
                        <span className={isCenter ? 'text-white/90' : 'text-ink-soft'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ── Bottom Apple Liquid CTA Button ── */}
                <div className="relative z-10 mt-8 pt-2">
                  <button
                    type="button"
                    onClick={() => scrollToBooking(pkg.name)}
                    className={`group/btn relative w-full overflow-hidden rounded-full py-3.5 px-6 font-body text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-300 active:scale-[0.97] shadow-md flex items-center justify-center gap-2 ${
                      isCenter
                        ? 'bg-white text-ink hover:bg-hover-surface shadow-[0_4px_20px_rgba(255,255,255,0.35),inset_0_1.5px_2px_rgba(255,255,255,1)]'
                        : 'bg-ink text-white hover:bg-ink-soft shadow-[0_4px_16px_rgba(20,36,51,0.2),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                    }`}
                  >
                    <span>Commission {pkg.name}</span>
                    <svg
                      className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </TiltCard>
            );
          })}
        </div>

        {/* ── Bespoke Tailoring Note ── */}
        <div className="mt-14 text-center">
          <p className="font-body text-xs text-ink-muted flex items-center justify-center gap-2">
            <svg className="h-4 w-4 text-accent-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Planning a destination wedding or multi-day editorial campaign? Every collection can be custom-tailored with bespoke film cinematography and studio lighting.
            </span>
          </p>
        </div>
      </div>

      {/* Water Droplet Wobble Keyframe */}
      <style jsx>{`
        @keyframes waterWobble {
          0% {
            transform: scale(1.18, 0.85);
          }
          30% {
            transform: scale(0.88, 1.14);
          }
          55% {
            transform: scale(1.08, 0.94);
          }
          75% {
            transform: scale(0.97, 1.03);
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
