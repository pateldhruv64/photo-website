'use client';

import type { SiteConfig } from '@/lib/types';
import { getWhatsAppNumber } from '@/lib/whatsapp';
import { motion, AnimatePresence } from 'framer-motion';

interface StudioCardProps {
  config: SiteConfig;
  isOpen: boolean;
  onClose: () => void;
}

export default function StudioCard({ config, isOpen, onClose }: StudioCardProps) {
  if (!isOpen) return null;

  // Helpers
  const phone = config.studio_phone || '';
  const website = config.studio_website || '';
  const services = config.studio_services || [];
  const description = config.studio_description || '';
  const logoUrl = config.studio_logo?.secure_url || '';
  const whatsapp = getWhatsAppNumber(config);
  const locationUrl = config.studio_location_url || '';

  // Social Links
  const instagram = config.social_links?.instagram || '';
  const facebook = config.social_links?.facebook || '';
  const youtube = config.social_links?.youtube || '';

  const getWhatsappLink = (numOrLink: string) => {
    if (!numOrLink) return '';
    if (numOrLink.startsWith('http')) return numOrLink;
    const cleanNum = numOrLink.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanNum}`;
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[340px] bg-[#F7F2EB] border border-[#EDE4D8] rounded-[2rem] p-7 text-[#1E1410] shadow-2xl flex flex-col items-center select-none"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#EAE3D9] hover:bg-[#E0D7C9] flex items-center justify-center text-[#7A6555] hover:text-[#1E1410] transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Top Handle */}
          <div className="w-10 h-1 bg-[#EDE4D8] rounded-full mb-4" />

          {/* Logo Emblem */}
          <div className="relative w-20 h-20 rounded-full bg-[#F7F2EB] border-2 border-[#EDE4D8] shadow-sm flex items-center justify-center overflow-hidden mb-3 p-[2px]">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={config.studio_name || 'Studio Logo'} 
                className="object-cover w-full h-full rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#EAE3D9] flex items-center justify-center text-[#7A6555]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            )}
          </div>

          {/* Studio Name */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-display text-xl font-medium tracking-wide text-[#1E1410] text-center">
              {config.studio_name || 'Studio Profile'}
            </h3>
            <span className="w-4 h-4 rounded-full bg-[#B5784A] text-white flex items-center justify-center text-[9px] font-bold">
              ✓
            </span>
          </div>
          
          <span className="text-[9px] tracking-[0.25em] uppercase text-[#7A6555] font-semibold mb-5">
            CREATIVE PHOTOGRAPHY
          </span>

          {/* Action Buttons */}
          <div className="flex gap-2.5 w-full mb-5">
            {phone && (
              <a 
                href={`tel:${phone}`}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#B5784A] hover:bg-[#A0673B] text-white font-body text-xs font-medium tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Call Us
              </a>
            )}
            {website && (
              <a 
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 rounded-full border border-[#EDE4D8] hover:bg-[#EAE3D9] text-[#1E1410] font-body text-xs font-medium tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Website
              </a>
            )}
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[#EDE4D8] mb-4" />

          {/* Expertise */}
          {services.length > 0 && (
            <div className="w-full mb-4">
              <h4 className="font-body text-[8px] tracking-[0.25em] uppercase text-[#7A6555] font-bold mb-2 text-center">
                OUR EXPERTISE
              </h4>
              <div className="flex flex-wrap justify-center gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                {services.map((service, index) => (
                  <span 
                    key={index} 
                    className="font-body text-[9px] font-medium tracking-wider uppercase text-[#1E1410] bg-[#EAE3D9] rounded-full px-3 py-1"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="font-body text-[11px] text-[#7A6555] italic text-center mb-4 px-2 leading-relaxed">
              &ldquo;{description}&rdquo;
            </p>
          )}

          {/* Social Icons */}
          <div className="flex items-center justify-center gap-3 mt-1">
            {whatsapp && (
              <a 
                href={getWhatsappLink(whatsapp)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-[#EAE3D9] flex items-center justify-center text-[#1E1410] hover:bg-[#B5784A] hover:text-white transition-colors"
                title="WhatsApp"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.455L0 24zm6.59-4.846c1.66.986 3.284 1.48 4.961 1.48 5.384 0 9.765-4.382 9.768-9.77 0-2.61-1.015-5.064-2.858-6.911-1.843-1.847-4.293-2.864-6.907-2.864-5.39 0-9.773 4.382-9.776 9.77-.001 1.8.497 3.559 1.44 5.17l-.999 3.648 3.732-.977z" />
                </svg>
              </a>
            )}
            {facebook && (
              <a 
                href={facebook} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-[#EAE3D9] flex items-center justify-center text-[#1E1410] hover:bg-[#B5784A] hover:text-white transition-colors"
                title="Facebook"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </a>
            )}
            {instagram && (
              <a 
                href={instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-[#EAE3D9] flex items-center justify-center text-[#1E1410] hover:bg-[#B5784A] hover:text-white transition-colors"
                title="Instagram"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            )}
            {youtube && (
              <a 
                href={youtube} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-[#EAE3D9] flex items-center justify-center text-[#1E1410] hover:bg-[#B5784A] hover:text-white transition-colors"
                title="YouTube"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.163c-.272-1.016-1.071-1.815-2.087-2.087C19.565 3.5 12 3.5 12 3.5s-7.565 0-9.411.576c-1.016.272-1.815 1.071-2.087 2.087C0 8.01 0 12 0 12s0 3.99.502 5.837c.272 1.016 1.071 1.815 2.087 2.087C4.435 20.5 12 20.5 12 20.5s7.565 0 9.411-.576c1.016-.272 1.815-1.071 2.087-2.087C24 15.99 24 12 24 12s0-3.99-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            )}
            {locationUrl && (
              <a 
                href={locationUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-full bg-[#EAE3D9] flex items-center justify-center text-[#1E1410] hover:bg-[#B5784A] hover:text-white transition-colors"
                title="Google Maps Location"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
