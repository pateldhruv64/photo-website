'use client';

import { motion } from 'framer-motion';
import type { SiteConfig } from '@/lib/types';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import BorderBeam from '@/components/ui/BorderBeam';

interface FooterProps {
  config?: SiteConfig | null;
}

export default function Footer({ config }: FooterProps) {
  const photographerName = config?.photographer_name || 'Niks Photos';
  const whatsappUrl = getWhatsAppUrl(config);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#1E1410] text-white pt-16 md:pt-24 pb-20 md:pb-12 border-t border-white/10 overflow-hidden">
      {/* Inspira UI Moving Border Beam on top edge */}
      <BorderBeam size={250} duration={8} colorFrom="#B5784A" colorTo="#F7F2EB" />

      {/* Giant Typography Background Watermark */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none select-none overflow-hidden opacity-5">
        <span className="font-display text-7xl sm:text-9xl md:text-[13rem] font-light tracking-[0.2em] uppercase text-white whitespace-nowrap">
          {photographerName}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-white/10">
          
          {/* Col 1: Brand & Tagline (Lg: 5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-2xl font-light text-white tracking-wide">
                    {photographerName}
                  </h3>
                  <span className="w-4 h-4 rounded-full bg-amber-300 text-[#1E1410] flex items-center justify-center text-[9px] font-bold">
                    ✓
                  </span>
                </div>
              </div>

              <p className="font-body text-xs uppercase tracking-[0.25em] text-amber-200/80 font-medium mb-4">
                CREATIVE PHOTOGRAPHY & VISUAL STORYTELLING
              </p>

              {config?.about_text && (
                <p className="font-body text-sm text-white/70 max-w-md leading-relaxed">
                  {config.about_text}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-white/50">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
              <span>Accepting new wedding & portrait bookings</span>
            </div>
          </div>

          {/* Col 2: Navigation Links (Lg: 3 Cols) */}
          <div className="lg:col-span-3">
            <h4 className="font-body text-xs font-semibold tracking-[0.25em] uppercase text-white/50 mb-5">
              Explore
            </h4>
            <ul className="space-y-3 font-body text-sm text-white/80">
              <li>
                <button onClick={scrollToTop} className="hover:text-amber-300 transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('gallery-section')} className="hover:text-amber-300 transition-colors">
                  Featured Gallery
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('pricing-section')} className="hover:text-amber-300 transition-colors">
                  Investment & Packages
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('testimonials-section')} className="hover:text-amber-300 transition-colors">
                  Client Experiences
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('booking-section')} className="hover:text-amber-300 transition-colors">
                  Book a Session
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Direct Connect & Social Dock (Lg: 4 Cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <h4 className="font-body text-xs font-semibold tracking-[0.25em] uppercase text-white/50 mb-5">
                Connect Directly
              </h4>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-[#25D366] text-white font-body text-xs font-semibold shadow-lg hover:bg-[#20ba59] transition-all mb-6"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.455L0 24zm6.59-4.846c1.66.986 3.284 1.48 4.961 1.48 5.384 0 9.765-4.382 9.768-9.77 0-2.61-1.015-5.064-2.858-6.911-1.843-1.847-4.293-2.864-6.907-2.864-5.39 0-9.773 4.382-9.776 9.77-.001 1.8.497 3.559 1.44 5.17l-.999 3.648 3.732-.977z" />
                  </svg>
                  <span>Chat on WhatsApp</span>
                </a>
              )}

              {/* Social Icons Dock */}
              <div className="flex items-center gap-3">
                {config?.social_links?.instagram && (
                  <motion.a
                    whileHover={{ scale: 1.2, y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    href={config.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:text-[#E1306C] hover:bg-white/20 transition-all shadow-md"
                    aria-label="Instagram"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </motion.a>
                )}
                {config?.social_links?.facebook && (
                  <motion.a
                    whileHover={{ scale: 1.2, y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    href={config.social_links.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:text-[#1877F2] hover:bg-white/20 transition-all shadow-md"
                    aria-label="Facebook"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                    </svg>
                  </motion.a>
                )}
                {config?.social_links?.youtube && (
                  <motion.a
                    whileHover={{ scale: 1.2, y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    href={config.social_links.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:text-[#FF0000] hover:bg-white/20 transition-all shadow-md"
                    aria-label="YouTube"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.163c-.272-1.016-1.071-1.815-2.087-2.087C19.565 3.5 12 3.5 12 3.5s-7.565 0-9.411.576c-1.016.272-1.815 1.071-2.087 2.087C0 8.01 0 12 0 12s0 3.99.502 5.837c.272 1.016 1.071 1.815 2.087 2.087C4.435 20.5 12 20.5 12 20.5s7.565 0 9.411-.576c1.016-.272 1.815-1.071 2.087-2.087C24 15.99 24 12 24 12s0-3.99-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </motion.a>
                )}
              </div>
            </div>

            {/* Back to Top Button */}
            <div className="mt-8 flex justify-start lg:justify-end">
              <button
                onClick={scrollToTop}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors group"
              >
                <span>Back to top</span>
                <span className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center group-hover:-translate-y-1 transition-transform">
                  ↑
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-body text-white/50">
          <p>© {new Date().getFullYear()} {photographerName}. All rights reserved.</p>
          <p className="tracking-wide">Designed for Creative Photography</p>
        </div>
      </div>
    </footer>
  );
}
