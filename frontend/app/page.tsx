import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import HomeGallery from '@/components/HomeGallery';
import Marquee from '@/components/Marquee';
import Footer from '@/components/Footer';
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
const RetouchShowcase = dynamic(() => import('@/components/RetouchShowcase'), {
  ssr: false,
  loading: () => <div className="h-96 bg-[#1E1410]" />,
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

        {/* Retouching RAW vs Edited Showcase */}
        <div className="reveal">
          <RetouchShowcase />
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

        {/* Inspira UI Luxury Footer */}
        <Footer config={config} />
      </div>
    </main>
  );
}
