import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import HomeGallery from '@/components/HomeGallery';
import Marquee from '@/components/Marquee';
import dynamic from 'next/dynamic';

const TestimonialsSection = dynamic(() => import('@/components/TestimonialsSection'), {
  ssr: false,
  loading: () => <div className="h-64 bg-[#F8F3EC]" />,
});
const StatsSection = dynamic(() => import('@/components/StatsSection'), {
  ssr: false,
  loading: () => <div className="h-48 bg-[#1E1410]" />,
});
const PricingSection = dynamic(() => import('@/components/PricingSection'), {
  ssr: false,
  loading: () => <div className="h-96 bg-[#FEFCF8]" />,
});
const BookingForm = dynamic(() => import('@/components/BookingForm'), {
  ssr: false,
  loading: () => <div className="h-80 bg-[#F8F3EC]" />,
});
import type { SiteConfig, Category, Photo, VideoItem } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface HomepageData {
  config: SiteConfig;
  categories: Category[];
  featuredPhotos: Photo[];
  photos: Photo[];
  videos: VideoItem[];
}

async function getHomepageData(): Promise<HomepageData | null> {
  try {
    const res = await fetch(`${API_URL}/homepage`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const data = await getHomepageData();

  const config = data?.config || null;
  const categories = data?.categories || [];
  const featuredPhotos = data?.featuredPhotos || [];
  const initialPhotos = data?.photos || [];
  const initialVideos = data?.videos || [];

  const defaultConfig: SiteConfig = {
    _id: '',
    photographer_name: 'Photographer',
    hero_title: 'Capturing Moments',
    hero_subtitle: 'Photography that tells your story',
    hero_photo: null,
    about_text: '',
    contact_email: '',
    social_links: { instagram: '', facebook: '', youtube: '' },
    navbar_links: [],
  };

  return (
    <main>
      <Navbar />

      {/* Hero — sticky, content scrolls over it */}
      <HeroSection config={config || defaultConfig} />

      {/* Content that scrolls over the hero */}
      <div className="relative z-10 bg-[#F7F2EB]">
        {/* Marquee of featured photos */}
        {featuredPhotos.length > 0 && (
          <div className="py-6 md:py-8 bg-surface reveal">
            <div className="max-w-7xl mx-auto px-4 mb-4 flex flex-col items-center">
              <p className="eyebrow justify-center">
                Featured Work
              </p>
            </div>
            <Marquee photos={featuredPhotos} reverse speed={40} />
            {featuredPhotos.length > 4 && (
              <div className="mt-2">
                <Marquee photos={featuredPhotos.slice().reverse()} speed={35} />
              </div>
            )}
          </div>
        )}

        {/* Unified Gallery with Category Tabs */}
        <div className="reveal">
          <HomeGallery
            categories={categories}
            initialPhotos={initialPhotos}
            initialVideos={initialVideos}
          />
        </div>

        {/* Testimonials Section */}
        <div className="reveal">
          <TestimonialsSection />
        </div>

        <div className="reveal">
          <StatsSection />
        </div>
        
        <div className="reveal">
          <PricingSection />
        </div>

        {/* Booking Form Section */}
        <div className="reveal">
          <BookingForm />
        </div>

        {/* Footer */}
        <footer className="border-t border-[#EDE4D8] py-12 md:py-16 bg-[#F7F2EB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="font-display text-2xl font-light text-text-primary">
                  {config?.photographer_name || 'Photographer'}
                </h3>
                {config?.about_text && (
                  <p className="mt-2 font-body text-sm text-text-muted max-w-md">
                    {config.about_text}
                  </p>
                )}
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-6">
                {config?.social_links?.instagram && (
                  <a
                    href={config.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-muted hover:text-text-primary transition-colors"
                    aria-label="Instagram"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                )}
                {config?.social_links?.facebook && (
                  <a
                    href={config.social_links.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-muted hover:text-text-primary transition-colors"
                    aria-label="Facebook"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                )}
                {config?.social_links?.youtube && (
                  <a
                    href={config.social_links.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-muted hover:text-text-primary transition-colors"
                    aria-label="YouTube"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
                      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="font-body text-xs text-text-muted">
                © {new Date().getFullYear()} {config?.photographer_name || 'Photographer'}. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
