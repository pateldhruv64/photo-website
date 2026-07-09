'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import type { SiteConfig, Category } from '@/lib/types';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === '/';
  const shouldBeWhite = !isHome || scrolled || mobileOpen;

  const { data: config } = useSWR<SiteConfig>('/config', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const { data: categories } = useSWR<Category[]>('/categories', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  // Navbar categories = ones with show_in_navbar
  const navCategories = categories?.filter((c) => c.show_in_navbar) || [];

  const whatsappUrl = getWhatsAppUrl(config);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change or resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when clicking anywhere outside of the navbar
  useEffect(() => {
    if (!mobileOpen) return;

    const handleOutsideClick = (e: Event) => {
      const navElement = document.getElementById('main-navbar');
      if (navElement && !navElement.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick, { capture: true });
      document.addEventListener('touchstart', handleOutsideClick, { capture: true });
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick, { capture: true });
      document.removeEventListener('touchstart', handleOutsideClick, { capture: true });
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        id="main-navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          shouldBeWhite
            ? 'bg-white/40 backdrop-blur-3xl shadow-sm border-b border-border/20'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo / Name */}
            <Link href="/" className="flex-shrink-0">
              <span className={`font-display text-xl md:text-2xl font-semibold tracking-wide transition-colors duration-300 ${shouldBeWhite ? 'text-text-primary' : 'text-white'}`}>
                {config?.photographer_name || 'Portfolio'}
              </span>
            </Link>
 
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navCategories
                .sort((a, b) => a.navbar_order - b.navbar_order)
                .map((cat) => (
                  <Link
                    key={cat._id}
                    href={`/?cat=${cat.slug}#gallery-section`}
                    onClick={(e) => {
                      if (window.location.pathname === '/') {
                        e.preventDefault();
                        window.history.pushState({}, '', `/?cat=${cat.slug}`);
                        window.dispatchEvent(new CustomEvent('categoryChange', { detail: cat._id }));
                        document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={`px-4 py-2 text-sm font-body transition-colors duration-300 relative group ${shouldBeWhite ? 'text-[#1A1A1A] hover:text-black font-semibold' : 'text-white hover:text-white/80 font-semibold'
                      }`}
                  >
                    {cat.name}
                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1.5px] transition-all duration-300 group-hover:w-3/4 ${shouldBeWhite ? 'bg-text-primary' : 'bg-white'
                      }`} />
                  </Link>
                ))}
 
              {/* Custom navbar links from config */}
              {config?.navbar_links
                ?.sort((a, b) => a.order - b.order)
                .map((link, i) => (
                  <Link
                    key={i}
                    href={link.url}
                    className={`px-4 py-2 text-sm font-body transition-colors duration-300 relative group ${shouldBeWhite ? 'text-[#1A1A1A] hover:text-black font-semibold' : 'text-white hover:text-white/80 font-semibold'
                      }`}
                  >
                    {link.label}
                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1.5px] transition-all duration-300 group-hover:w-3/4 ${shouldBeWhite ? 'bg-text-primary' : 'bg-white'
                      }`} />
                  </Link>
                ))}
 
              {/* Book Now CTA & Social Links */}
              {config?.contact_email && (
                <div className="ml-4 flex items-center gap-4">
                  <a
                    href="/#booking-section"
                    onClick={(e) => {
                      if (window.location.pathname === '/') {
                        e.preventDefault();
                        document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="px-5 py-2 text-sm font-body bg-text-primary text-white rounded-md hover:bg-gray-800 transition-colors duration-200"
                  >
                    Book Now
                  </a>
 
                  {/* Social Icons on the right side */}
                  <div className="flex items-center gap-3">
                    {config?.social_links?.instagram && (
                      <a href={config.social_links.instagram} target="_blank" rel="noopener noreferrer" className="transition-transform duration-150 hover:scale-110">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={shouldBeWhite ? "#1A1A1A" : "#FFFFFF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                        </svg>
                      </a>
                    )}
                    {config?.social_links?.facebook && (
                      <a href={config.social_links.facebook} target="_blank" rel="noopener noreferrer" className="transition-transform duration-150 hover:scale-110">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={shouldBeWhite ? "#1A1A1A" : "#FFFFFF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                        </svg>
                      </a>
                    )}
                    {config?.social_links?.youtube && (
                      <a href={config.social_links.youtube} target="_blank" rel="noopener noreferrer" className="transition-transform duration-150 hover:scale-110">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={shouldBeWhite ? "#1A1A1A" : "#FFFFFF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
                          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                        </svg>
                      </a>
                    )}
                    {whatsappUrl && (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="transition-transform duration-150 hover:scale-110">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={shouldBeWhite ? "#1A1A1A" : "#FFFFFF"}>
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.42 9.863-9.864.002-2.634-1.02-5.11-2.881-6.974-1.86-1.865-4.343-2.891-6.986-2.893-5.44 0-9.866 4.418-9.87 9.864-.001 1.77.462 3.5 1.343 5.03l-.974 3.565 3.683-.966zm12.352-7.073c-.33-.165-1.951-.963-2.251-1.072-.3-.11-.518-.165-.736.165-.218.33-.846 1.072-1.037 1.29-.19.218-.38.245-.71.08-.33-.165-1.393-.513-2.653-1.637-1-.893-1.676-2-1.874-2.33-.198-.33-.02-.508.145-.671.15-.147.33-.38.495-.57.165-.188.22-.321.33-.536.11-.215.056-.4-.028-.565-.084-.165-.736-1.77-.1-.99-2.036-.3-1.074-.627-1.424-.736-.3-.11-.647-.099-.9.165-.253.264-1.01 1.022-1.01 2.49 0 1.469 1.07 2.89 1.218 3.09.148.199 2.107 3.217 5.105 4.512.714.309 1.272.494 1.707.632.717.228 1.37.196 1.885.119.574-.085 1.951-.798 2.224-1.57.272-.772.272-1.433.19-1.57-.08-.136-.3-.217-.63-.382z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
 
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 transition-colors duration-300 ${shouldBeWhite ? 'text-text-primary' : 'text-white'}`}
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 relative flex flex-col justify-between">
                <span
                  className={`w-full h-[1.5px] transition-all duration-300 origin-center ${shouldBeWhite ? 'bg-text-primary' : 'bg-white'} ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''
                    }`}
                />
                <span
                  className={`w-full h-[1.5px] transition-all duration-300 ${shouldBeWhite ? 'bg-text-primary' : 'bg-white'} ${mobileOpen ? 'opacity-0 scale-0' : ''
                    }`}
                />
                <span
                  className={`w-full h-[1.5px] transition-all duration-300 origin-center ${shouldBeWhite ? 'bg-text-primary' : 'bg-white'} ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''
                    }`}
                />
              </div>
            </button>
          </div>
        </div>
 
        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 bg-transparent ${mobileOpen ? 'max-h-[400px] border-b border-border/10' : 'max-h-0'
            }`}
        >
          <div className="px-4 py-4 space-y-1 animate-slide-down">
            {navCategories
              .sort((a, b) => a.navbar_order - b.navbar_order)
              .map((cat) => (
                <Link
                  key={cat._id}
                  href={`/?cat=${cat.slug}#gallery-section`}
                  onClick={(e) => {
                    setMobileOpen(false);
                    if (window.location.pathname === '/') {
                      e.preventDefault();
                      window.history.pushState({}, '', `/?cat=${cat.slug}`);
                      window.dispatchEvent(new CustomEvent('categoryChange', { detail: cat._id }));
                      document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="block px-4 py-3 text-sm font-body font-medium text-[#1A1A1A] hover:bg-black/5 rounded-sm transition-all duration-200"
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
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-body font-medium text-[#1A1A1A] hover:bg-black/5 rounded-sm transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}

            {config?.contact_email && (
              <div className="mx-4 mt-4 flex flex-col gap-3">
                <a
                  href="/#booking-section"
                  onClick={(e) => {
                    setMobileOpen(false);
                    if (window.location.pathname === '/') {
                      e.preventDefault();
                      document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="block px-5 py-3 text-sm font-body bg-text-primary text-white text-center rounded-md"
                >
                  Book Now
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Floating Social Icons Bar (Bottom Left) — Persistent floating bar on mobile only */}
      <div className="fixed left-0 bottom-24 z-40 hidden max-md:flex flex-col items-center gap-2 bg-black/30 backdrop-blur-md py-3 pl-1 pr-2 rounded-r-2xl shadow-[4px_4px_16px_rgba(0,0,0,0.25)] border-y border-r border-white/10">
        {config?.social_links?.facebook && (
          <a
            href={config.social_links.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded-full bg-white text-[#1A1A1A] flex items-center justify-center transition-all duration-200 active:scale-90"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
            </svg>
          </a>
        )}
        {config?.social_links?.instagram && (
          <a
            href={config.social_links.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded-full bg-white text-[#1A1A1A] flex items-center justify-center transition-all duration-200 active:scale-90"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
        )}
        {config?.social_links?.youtube && (
          <a
            href={config.social_links.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded-full bg-white text-[#1A1A1A] flex items-center justify-center transition-all duration-200 active:scale-90"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.163c-.272-1.016-1.071-1.815-2.087-2.087C19.565 3.5 12 3.5 12 3.5s-7.565 0-9.411.576c-1.016.272-1.815 1.071-2.087 2.087C0 8.01 0 12 0 12s0 3.99.502 5.837c.272 1.016 1.071 1.815 2.087 2.087C4.435 20.5 12 20.5 12 20.5s7.565 0 9.411-.576c1.016-.272 1.815-1.071 2.087-2.087C24 15.99 24 12 24 12s0-3.99-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
        )}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded-full bg-white text-[#1A1A1A] flex items-center justify-center transition-all duration-200 active:scale-90"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.42 9.863-9.864.002-2.634-1.02-5.11-2.881-6.974-1.86-1.865-4.343-2.891-6.986-2.893-5.44 0-9.866 4.418-9.87 9.864-.001 1.77.462 3.5 1.343 5.03l-.974 3.565 3.683-.966zm12.352-7.073c-.33-.165-1.951-.963-2.251-1.072-.3-.11-.518-.165-.736.165-.218.33-.846 1.072-1.037 1.29-.19.218-.38.245-.71.08-.33-.165-1.393-.513-2.653-1.637-1-.893-1.676-2-1.874-2.33-.198-.33-.02-.508.145-.671.15-.147.33-.38.495-.57.165-.188.22-.321.33-.536.11-.215.056-.4-.028-.565-.084-.165-.736-1.77-.1-.99-2.036-.3-1.074-.627-1.424-.736-.3-.11-.647-.099-.9.165-.253.264-1.01 1.022-1.01 2.49 0 1.469 1.07 2.89 1.218 3.09.148.199 2.107 3.217 5.105 4.512.714.309 1.272.494 1.707.632.717.228 1.37.196 1.885.119.574-.085 1.951-.798 2.224-1.57.272-.772.272-1.433.19-1.57-.08-.136-.3-.217-.63-.382z" />
            </svg>
          </a>
        )}
      </div>
    </>
  );
}
