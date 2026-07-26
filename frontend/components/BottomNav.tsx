'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { fetcher } from '@/lib/fetcher';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import type { SiteConfig } from '@/lib/types';

export default function BottomNav() {
  const pathname = usePathname();
  const { data: config } = useSWR<SiteConfig>('/config', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const whatsappUrl = getWhatsAppUrl(config);

  if (pathname?.startsWith('/admin')) return null;

  const isHome = pathname === '/';

  const scrollToGallery = () => {
    document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPricing = () => {
    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToBooking = () => {
    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:hidden bg-[#1E1410]/95 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] px-4 py-2 text-white"
      id="bottom-nav"
    >
      <div className="flex items-center gap-5">
        {/* 1. Home (Modern Minimalist House) */}
        <Link href="/" className="flex flex-col items-center group" title="Home">
          <motion.div
            whileHover={{ scale: 1.2, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2.5 rounded-full transition-all ${
              isHome ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-md' : 'text-white/70 group-hover:text-white'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isHome ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20V9.5z" />
              <path d="M9 21v-7a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v7" />
            </svg>
          </motion.div>
        </Link>

        {/* 2. Gallery (Photography Aperture / Frame) */}
        <button onClick={scrollToGallery} className="flex flex-col items-center group" title="Featured Gallery">
          <motion.div
            whileHover={{ scale: 1.2, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 rounded-full text-white/70 group-hover:text-white transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </motion.div>
        </button>

        {/* 3. Investment & Packages (Luxury Tag / Diamond Badge) */}
        <button onClick={scrollToPricing} className="flex flex-col items-center group" title="Investment Packages">
          <motion.div
            whileHover={{ scale: 1.2, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 rounded-full text-white/70 group-hover:text-amber-300 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <circle cx="7" cy="7" r="1.5" fill="currentColor" />
            </svg>
          </motion.div>
        </button>

        {/* 4. Direct Connect (WhatsApp or Book Session) */}
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center group"
            title="WhatsApp Chat"
          >
            <motion.div
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.9 }}
              className="p-2.5 rounded-full bg-[#25D366] text-white shadow-lg border border-white/20"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.42 9.863-9.864.002-2.634-1.02-5.11-2.881-6.974-1.86-1.865-4.343-2.891-6.986-2.893-5.44 0-9.866 4.418-9.87 9.864-.001 1.77.462 3.5 1.343 5.03l-.974 3.565 3.683-.966zm12.352-7.073c-.33-.165-1.951-.963-2.251-1.072-.3-.11-.518-.165-.736.165-.218.33-.846 1.072-1.037 1.29-.19.218-.38.245-.71.08-.33-.165-1.393-.513-2.653-1.637-1-.893-1.676-2-1.874-2.33-.198-.33-.02-.508.145-.671.15-.147.33-.38.495-.57.165-.188.22-.321.33-.536.11-.215.056-.4-.028-.565-.084-.165-.736-1.77-.1-.99-2.036-.3-1.074-.627-1.424-.736-.3-.11-.647-.099-.9.165-.253.264-1.01 1.022-1.01 2.49 0 1.469 1.07 2.89 1.218 3.09.148.199 2.107 3.217 5.105 4.512.714.309 1.272.494 1.707.632.717.228 1.37.196 1.885.119.574-.085 1.951-.798 2.224-1.57.272-.772.272-1.433.19-1.57-.08-.136-.3-.217-.63-.382z" />
              </svg>
            </motion.div>
          </a>
        ) : (
          <button onClick={scrollToBooking} className="flex flex-col items-center group" title="Book Session">
            <motion.div
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.9 }}
              className="p-2.5 rounded-full bg-white text-[#1E1410] shadow-lg"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </motion.div>
          </button>
        )}
      </div>
    </nav>
  );
}
