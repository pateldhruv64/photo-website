'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { fetcher } from '@/lib/fetcher';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import type { SiteConfig, Category } from '@/lib/types';
import ShimmerButton from '@/components/ui/ShimmerButton';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const headerRef = useRef<HTMLDivElement>(null);

  const { data: config } = useSWR<SiteConfig>('/config', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const { data: categories } = useSWR<Category[]>('/categories', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const navCategories = categories?.filter((c) => c.show_in_navbar) || [];
  const whatsappUrl = getWhatsAppUrl(config);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleBookScroll = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      const el = document.getElementById('booking-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      {/* ─── Full-Screen Mobile Menu Overlay ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[45] bg-[#1E1410]/98 backdrop-blur-xl md:hidden flex flex-col"
          >
            {/* Decorative ambient glows */}
            <div className="absolute top-20 right-0 w-60 h-60 bg-amber-500/8 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-40 left-0 w-40 h-40 bg-amber-700/6 rounded-full blur-[80px] pointer-events-none" />

            {/* Close button */}
            <div className="flex justify-end p-5 pt-6">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Nav Links with staggered animation */}
            <div className="flex-1 flex flex-col justify-center px-8 -mt-10">
              {[
                { href: '/', label: 'Home', isActive: pathname === '/' },
                ...navCategories
                  .sort((a, b) => a.navbar_order - b.navbar_order)
                  .map((cat) => ({
                    href: `/${cat.slug}`,
                    label: cat.name,
                    isActive: pathname === `/${cat.slug}`,
                  })),
                ...(config?.navbar_links?.sort((a, b) => a.order - b.order).map((link) => ({
                  href: link.url,
                  label: link.label,
                  isActive: false,
                })) || []),
              ].map((item, idx) => (
                <motion.div
                  key={item.href + item.label}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ delay: 0.1 + idx * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between py-4 border-b border-white/5 group ${
                      item.isActive ? 'text-amber-300' : 'text-white/90'
                    }`}
                  >
                    <span className="font-display text-2xl font-light tracking-wide group-hover:translate-x-2 transition-transform duration-300">
                      {item.label}
                    </span>
                    {item.isActive ? (
                      <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                    ) : (
                      <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </Link>
                </motion.div>
              ))}

              {/* Book Session CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-8"
              >
                <Link
                  href="/#booking-section"
                  onClick={(e) => {
                    setMobileOpen(false);
                    handleBookScroll(e);
                  }}
                >
                  <ShimmerButton className="w-full py-4 text-sm font-medium rounded-full bg-white text-[#1E1410]">
                    ✦ Book a Session
                  </ShimmerButton>
                </Link>
              </motion.div>
            </div>

            {/* Bottom: Social Icons + Branding */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="px-8 pb-8"
            >
              {/* Social Icons Row */}
              <div className="flex items-center justify-center gap-3 mb-5">
                {config?.social_links?.instagram && (
                  <a href={config.social_links.instagram} target="_blank" rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:text-[#E1306C] hover:bg-white/15 transition-all" aria-label="Instagram">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                )}
                {config?.social_links?.facebook && (
                  <a href={config.social_links.facebook} target="_blank" rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:text-[#1877F2] hover:bg-white/15 transition-all" aria-label="Facebook">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>
                  </a>
                )}
                {config?.social_links?.youtube && (
                  <a href={config.social_links.youtube} target="_blank" rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:text-[#FF0000] hover:bg-white/15 transition-all" aria-label="YouTube">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.163c-.272-1.016-1.071-1.815-2.087-2.087C19.565 3.5 12 3.5 12 3.5s-7.565 0-9.411.576c-1.016.272-1.815 1.071-2.087 2.087C0 8.01 0 12 0 12s0 3.99.502 5.837c.272 1.016 1.071 1.815 2.087 2.087C4.435 20.5 12 20.5 12 20.5s7.565 0 9.411-.576c1.016-.272 1.815-1.071 2.087-2.087C24 15.99 24 12 24 12s0-3.99-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                  </a>
                )}
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center transition-all shadow-md" aria-label="WhatsApp">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.42 9.863-9.864.002-2.634-1.02-5.11-2.881-6.974-1.86-1.865-4.343-2.891-6.986-2.893-5.44 0-9.866 4.418-9.87 9.864-.001 1.77.462 3.5 1.343 5.03l-.974 3.565 3.683-.966zm12.352-7.073c-.33-.165-1.951-.963-2.251-1.072-.3-.11-.518-.165-.736.165-.218.33-.846 1.072-1.037 1.29-.19.218-.38.245-.71.08-.33-.165-1.393-.513-2.653-1.637-1-.893-1.676-2-1.874-2.33-.198-.33-.02-.508.145-.671.15-.147.33-.38.495-.57.165-.188.22-.321.33-.536.11-.215.056-.4-.028-.565-.084-.165-.736-1.77-.1-.99-2.036-.3-1.074-.627-1.424-.736-.3-.11-.647-.099-.9.165-.253.264-1.01 1.022-1.01 2.49 0 1.469 1.07 2.89 1.218 3.09.148.199 2.107 3.217 5.105 4.512.714.309 1.272.494 1.707.632.717.228 1.37.196 1.885.119.574-.085 1.951-.798 2.224-1.57.272-.772.272-1.433.19-1.57-.08-.136-.3-.217-.63-.382z" /></svg>
                  </a>
                )}
              </div>
              {/* Branding */}
              <p className="text-center font-body text-[10px] tracking-[0.3em] uppercase text-white/30">
                © {new Date().getFullYear()} {config?.photographer_name || 'Niks Photos'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-3 transition-all duration-300 pointer-events-none">
        <div
          ref={headerRef}
          className={`max-w-6xl mx-auto pointer-events-auto rounded-full transition-all duration-500 border shadow-2xl ${
            scrolled
              ? 'bg-[#1E1410]/90 backdrop-blur-xl border-white/15 py-2.5 px-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]'
              : 'bg-[#1E1410]/80 backdrop-blur-lg border-white/10 py-3.5 px-6 shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between">
            
            {/* Left: Studio Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-display text-lg sm:text-xl font-light text-white tracking-wide">
                {config?.photographer_name || 'niks photos'}
              </span>
            </Link>

            {/* Center: Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={`px-3.5 py-1.5 rounded-full text-xs font-body tracking-wider uppercase transition-all ${
                  pathname === '/' ? 'text-amber-300 bg-white/10 font-semibold' : 'text-white/80 hover:text-white hover:bg-white/5'
                }`}
              >
                Home
              </Link>

              {navCategories
                .sort((a, b) => a.navbar_order - b.navbar_order)
                .map((cat) => (
                  <Link
                    key={cat._id}
                    href={`/${cat.slug}`}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-body tracking-wider uppercase transition-all ${
                      pathname === `/${cat.slug}` ? 'text-amber-300 bg-white/10 font-semibold' : 'text-white/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}

              {config?.navbar_links
                ?.sort((a, b) => a.order - b.order)
                .map((link, i) => (
                  <Link
                    key={i}
                    href={link.url}
                    className="px-3.5 py-1.5 rounded-full text-xs font-body tracking-wider uppercase text-white/80 hover:text-white hover:bg-white/5 transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
            </nav>

            {/* Right: Book Now CTA & Desktop Social Dock */}
            <div className="hidden md:flex items-center gap-4">
              {/* Desktop Social Dock */}
              <div className="flex items-center gap-2 border-r border-white/15 pr-4">
                {config?.social_links?.instagram && (
                  <motion.a
                    whileHover={{ scale: 1.2, y: -2 }}
                    href={config.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-amber-300 transition-colors"
                    aria-label="Instagram"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </motion.a>
                )}
                {config?.social_links?.facebook && (
                  <motion.a
                    whileHover={{ scale: 1.2, y: -2 }}
                    href={config.social_links.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-amber-300 transition-colors"
                    aria-label="Facebook"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                    </svg>
                  </motion.a>
                )}
                {config?.social_links?.youtube && (
                  <motion.a
                    whileHover={{ scale: 1.2, y: -2 }}
                    href={config.social_links.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-amber-300 transition-colors"
                    aria-label="YouTube"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.163c-.272-1.016-1.071-1.815-2.087-2.087C19.565 3.5 12 3.5 12 3.5s-7.565 0-9.411.576c-1.016.272-1.815 1.071-2.087 2.087C0 8.01 0 12 0 12s0 3.99.502 5.837c.272 1.016 1.071 1.815 2.087 2.087C4.435 20.5 12 20.5 12 20.5s7.565 0 9.411-.576c1.016-.272 1.815-1.071 2.087-2.087C24 15.99 24 12 24 12s0-3.99-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </motion.a>
                )}
                {whatsappUrl && (
                  <motion.a
                    whileHover={{ scale: 1.2, y: -2 }}
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-[#25D366] transition-colors"
                    aria-label="WhatsApp"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.42 9.863-9.864.002-2.634-1.02-5.11-2.881-6.974-1.86-1.865-4.343-2.891-6.986-2.893-5.44 0-9.866 4.418-9.87 9.864-.001 1.77.462 3.5 1.343 5.03l-.974 3.565 3.683-.966zm12.352-7.073c-.33-.165-1.951-.963-2.251-1.072-.3-.11-.518-.165-.736.165-.218.33-.846 1.072-1.037 1.29-.19.218-.38.245-.71.08-.33-.165-1.393-.513-2.653-1.637-1-.893-1.676-2-1.874-2.33-.198-.33-.02-.508.145-.671.15-.147.33-.38.495-.57.165-.188.22-.321.33-.536.11-.215.056-.4-.028-.565-.084-.165-.736-1.77-.1-.99-2.036-.3-1.074-.627-1.424-.736-.3-.11-.647-.099-.9.165-.253.264-1.01 1.022-1.01 2.49 0 1.469 1.07 2.89 1.218 3.09.148.199 2.107 3.217 5.105 4.512.714.309 1.272.494 1.707.632.717.228 1.37.196 1.885.119.574-.085 1.951-.798 2.224-1.57.272-.772.272-1.433.19-1.57-.08-.136-.3-.217-.63-.382z" />
                    </svg>
                  </motion.a>
                )}
              </div>

              {/* Book Now ShimmerButton */}
              <Link href="/#booking-section" onClick={handleBookScroll}>
                <ShimmerButton className="px-5 py-2 text-xs font-medium rounded-full bg-white text-[#1E1410] hover:bg-[#F7F2EB] shadow-lg">
                  Book Session
                </ShimmerButton>
              </Link>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-white hover:text-amber-300 transition-colors"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 relative flex flex-col justify-between">
                <span className={`w-full h-[1.5px] bg-current transition-all duration-300 origin-center ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                <span className={`w-full h-[1.5px] bg-current transition-all duration-300 ${mobileOpen ? 'opacity-0 scale-0' : ''}`} />
                <span className={`w-full h-[1.5px] bg-current transition-all duration-300 origin-center ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
              </div>
            </button>

          </div>
        </div>
      </header>
    </>
  );
}
