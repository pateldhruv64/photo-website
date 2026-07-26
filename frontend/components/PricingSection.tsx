'use client';

import TiltCard from '@/components/ui/TiltCard';
import ShimmerButton from '@/components/ui/ShimmerButton';

const PACKAGES = [
  {
    name: 'Basic',
    price: '₹15,000',
    duration: '2 Hours',
    photos: '50 Edited Photos',
    features: ['1 Location', 'Online Gallery', 'Digital Delivery'],
    highlight: false,
  },
  {
    name: 'Standard',
    price: '₹25,000',
    duration: '4 Hours',
    photos: '100 Edited Photos',
    features: ['2 Locations', 'Online Gallery', 'Digital Delivery', 'Print-Ready Files'],
    highlight: true,
  },
  {
    name: 'Premium',
    price: '₹45,000',
    duration: 'Full Day',
    photos: '200+ Edited Photos',
    features: ['Unlimited Locations', 'Private Client Gallery', 'Digital + USB Delivery', 'Album Design'],
    highlight: false,
  },
];

export default function PricingSection() {
  const scrollToBooking = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-12 md:py-20 bg-surface relative overflow-hidden" id="pricing-section">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 flex flex-col items-center">
          <p className="eyebrow justify-center mb-2">
            Investment & Packages
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-text-primary">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-3 font-body text-sm md:text-base text-text-muted max-w-lg">
            Prices are starting rates. Custom tailored packages available upon request.
          </p>
          <div className="divider-line mx-auto mt-6 max-w-[80px]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PACKAGES.map((pkg) => (
            <TiltCard
              key={pkg.name}
              maxTilt={6}
              spotlightColor={pkg.highlight ? 'rgba(255, 255, 255, 0.15)' : 'rgba(30, 20, 16, 0.08)'}
              className={`rounded-2xl p-8 transition-all flex flex-col justify-between ${
                pkg.highlight
                  ? 'bg-[#1E1410] border-2 border-white/20 text-white shadow-2xl scale-105'
                  : 'bg-white/80 backdrop-blur-sm border border-border text-text-primary shadow-sm hover:shadow-xl'
              }`}
            >
              <div>
                {pkg.highlight && (
                  <span className="inline-block font-body text-[10px] tracking-[0.25em] uppercase text-amber-300 bg-white/10 px-3 py-1 rounded-full mb-4 border border-amber-300/30">
                    ★ Most Popular
                  </span>
                )}
                <h3 className={`font-display text-2xl font-light mb-1 ${pkg.highlight ? 'text-white' : 'text-text-primary'}`}>
                  {pkg.name}
                </h3>
                <p className={`font-display text-4xl font-semibold mt-4 mb-2 ${pkg.highlight ? 'text-white' : 'text-text-primary'}`}>
                  {pkg.price}
                </p>
                <p className={`font-body text-sm mb-6 ${pkg.highlight ? 'text-white/70' : 'text-text-muted'}`}>
                  {pkg.duration} · {pkg.photos}
                </p>
                <div className="h-px bg-current opacity-10 mb-6" />
                <ul className="space-y-3.5 mb-8">
                  {pkg.features.map((f) => (
                    <li key={f} className={`font-body text-sm flex items-center gap-3 ${pkg.highlight ? 'text-white/90' : 'text-text-muted'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${pkg.highlight ? 'bg-white/20' : 'bg-[#EAE3D9]'}`}>
                        <svg width="10" height="10" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l2.5 2.5L9 1" stroke={pkg.highlight ? '#fff' : '#1E1410'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                {pkg.highlight ? (
                  <ShimmerButton onClick={scrollToBooking} className="w-full bg-white text-[#1E1410] hover:bg-amber-50 font-semibold border-none py-3.5">
                    Book {pkg.name} Package
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={scrollToBooking}
                    className="w-full text-center py-3.5 rounded-full border border-[#1E1410] font-body text-sm font-medium transition-all duration-300 text-[#1E1410] hover:bg-[#1E1410] hover:text-white"
                  >
                    Select {pkg.name}
                  </button>
                )}
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
