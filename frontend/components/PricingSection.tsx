'use client';

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
  return (
    <section className="py-16 md:py-24 bg-surface" id="pricing-section">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="font-body text-xs tracking-[0.3em] uppercase text-text-muted mb-3">
            Investment
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-light text-text-primary">
            Packages
          </h2>
          <p className="mt-3 font-body text-sm text-text-muted">
            Prices are starting rates. Custom packages available on request.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              className={`rounded-xl p-8 border transition-all ${
                pkg.highlight
                  ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white'
                  : 'bg-white border-border text-text-primary'
              }`}
            >
              {pkg.highlight && (
                <p className="font-body text-xs tracking-[0.2em] uppercase text-white/50 mb-4">
                  Most Popular
                </p>
              )}
              <h3 className={`font-display text-2xl font-light mb-1 ${pkg.highlight ? 'text-white' : 'text-text-primary'}`}>
                {pkg.name}
              </h3>
              <p className={`font-display text-3xl font-semibold mt-4 mb-1 ${pkg.highlight ? 'text-white' : 'text-text-primary'}`}>
                {pkg.price}
              </p>
              <p className={`font-body text-sm mb-6 ${pkg.highlight ? 'text-white/60' : 'text-text-muted'}`}>
                {pkg.duration} · {pkg.photos}
              </p>
              <ul className="space-y-3 mb-8">
                {pkg.features.map((f) => (
                  <li key={f} className={`font-body text-sm flex items-center gap-2 ${pkg.highlight ? 'text-white/80' : 'text-text-muted'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${pkg.highlight ? 'bg-white/20' : 'bg-[#EAEAEA]'}`}>
                      <svg width="8" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke={pkg.highlight ? '#fff' : '#1A1A1A'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#booking-section"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`block w-full text-center py-3 rounded-lg font-body text-sm font-medium transition-all ${
                  pkg.highlight
                    ? 'bg-white text-[#1A1A1A] hover:bg-gray-100'
                    : 'bg-[#1A1A1A] text-white hover:bg-gray-800'
                }`}
              >
                Book This Package
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
