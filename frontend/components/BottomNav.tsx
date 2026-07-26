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

  // Don't render on admin pages
  if (pathname?.startsWith('/admin')) return null;

  const isHome = pathname === '/';

  const scrollToGallery = () => {
    const gallerySection = document.getElementById('gallery-section');
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToBooking = () => {
    const bookingSection = document.getElementById('booking-section');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:hidden bg-[#1E1410]/90 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl px-4 py-2 text-white"
      id="bottom-nav"
    >
      <div className="flex items-center gap-6">
        {/* Home */}
        <Link href="/" className="flex flex-col items-center gap-1 group">
          <motion.div
            whileHover={{ scale: 1.25, y: -4 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2 rounded-full transition-colors ${
              isHome ? 'bg-white/20 text-amber-300' : 'text-white/70 group-hover:text-white'
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={isHome ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </motion.div>
        </Link>

        {/* Gallery */}
        <button onClick={scrollToGallery} className="flex flex-col items-center gap-1 group">
          <motion.div
            whileHover={{ scale: 1.25, y: -4 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full text-white/70 group-hover:text-white transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </motion.div>
        </button>

        {/* Pricing */}
        <button
          onClick={() => {
            document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-1 group"
        >
          <motion.div
            whileHover={{ scale: 1.25, y: -4 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full text-white/70 group-hover:text-white transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </motion.div>
        </button>

        {/* Contact / WhatsApp */}
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 group"
          >
            <motion.div
              whileHover={{ scale: 1.25, y: -4 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full bg-[#25D366] text-white shadow-lg"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.42 9.863-9.864.002-2.634-1.02-5.11-2.881-6.974-1.86-1.865-4.343-2.891-6.986-2.893-5.44 0-9.866 4.418-9.87 9.864-.001 1.77.462 3.5 1.343 5.03l-.974 3.565 3.683-.966zm12.352-7.073c-.33-.165-1.951-.963-2.251-1.072-.3-.11-.518-.165-.736.165-.218.33-.846 1.072-1.037 1.29-.19.218-.38.245-.71.08-.33-.165-1.393-.513-2.653-1.637-1-.893-1.676-2-1.874-2.33-.198-.33-.02-.508.145-.671.15-.147.33-.38.495-.57.165-.188.22-.321.33-.536.11-.215.056-.4-.028-.565-.084-.165-.736-1.77-.1-.99-2.036-.3-1.074-.627-1.424-.736-.3-.11-.647-.099-.9.165-.253.264-1.01 1.022-1.01 2.49 0 1.469 1.07 2.89 1.218 3.09.148.199 2.107 3.217 5.105 4.512.714.309 1.272.494 1.707.632.717.228 1.37.196 1.885.119.574-.085 1.951-.798 2.224-1.57.272-.772.272-1.433.19-1.57-.08-.136-.3-.217-.63-.382z" />
              </svg>
            </motion.div>
          </a>
        ) : (
          <button onClick={scrollToBooking} className="flex flex-col items-center gap-1 group">
            <motion.div
              whileHover={{ scale: 1.25, y: -4 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full bg-white/20 text-white"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </motion.div>
          </button>
        )}
      </div>
    </nav>
  );
}
