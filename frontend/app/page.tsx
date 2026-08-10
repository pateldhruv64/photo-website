import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import HomeGallery from '@/components/HomeGallery';
import Marquee from '@/components/Marquee';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';

const TestimonialsSection = dynamic(() => import('@/components/TestimonialsSection'), {
  ssr: false,
  loading: () => <div className="h-64 bg-[#F7FBFC]" />,
});
const StatsSection = dynamic(() => import('@/components/StatsSection'), {
  ssr: false,
  loading: () => <div className="h-48 bg-[#142433]" />,
});
const PricingSection = dynamic(() => import('@/components/PricingSection'), {
  ssr: false,
  loading: () => <div className="h-96 bg-[#FFFFFF]" />,
});
const RetouchShowcase = dynamic(() => import('@/components/RetouchShowcase'), {
  ssr: false,
  loading: () => <div className="h-96 bg-[#142433]" />,
});
const BookingForm = dynamic(() => import('@/components/BookingForm'), {
  ssr: false,
  loading: () => <div className="h-80 bg-[#F7FBFC]" />,
});
const ProcessTimeline = dynamic(() => import('@/components/ProcessTimeline'), {
  ssr: false,
  loading: () => <div className="h-96 bg-[#142433]" />,
});
const FAQSection = dynamic(() => import('@/components/FAQSection'), {
  ssr: false,
  loading: () => <div className="h-80 bg-[#F7FBFC]" />,
});
const InstagramFeed = dynamic(() => import('@/components/InstagramFeed'), {
  ssr: false,
  loading: () => <div className="h-80 bg-[#F7FBFC]" />,
});
import JsonLd from '@/components/JsonLd';
import SeoContentSection from '@/components/SeoContentSection';
import { FAQ_DATA } from '@/lib/faq';
import {
  getSeo,
  buildMetadata,
  faqNode,
  imageGalleryNode,
  breadcrumbNode,
  SITE_URL,
} from '@/lib/seo';
import type { Metadata } from 'next';
import type { SiteConfig, Category, Photo, VideoItem } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo();
  return buildMetadata(seo, {
    title: seo.meta_title,
    description: seo.meta_description,
    path: '/',
  });
}

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
  const [data, seo] = await Promise.all([getHomepageData(), getSeo()]);

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

  // Homepage-specific structured data. Site-wide nodes (LocalBusiness,
  // WebSite, Person) root layout se aate hain — yaha duplicate nahi karte.
  const pageSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbNode([{ name: 'Home', path: '/' }]),
      faqNode(FAQ_DATA),
      ...(featuredPhotos.length
        ? [
            imageGalleryNode(seo, {
              name: `${seo.brand} — Featured Photography`,
              description: seo.meta_description,
              path: '/',
              images: featuredPhotos.map((p) => ({
                public_id: p.public_id,
                title: p.title,
                alt: p.alt_text,
              })),
            }),
          ]
        : []),
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/#webpage`,
        url: `${SITE_URL}/`,
        name: seo.meta_title,
        description: seo.meta_description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#business` },
        inLanguage: 'en-IN',
      },
    ],
  };

  return (
    <main>
      <JsonLd id="home-schema" data={pageSchema} />
      <Navbar config={config} categories={categories} />

      {/* Hero — sticky, content scrolls over it */}
      <HeroSection config={config || defaultConfig} seo={seo} />

      {/* Content that scrolls over the hero */}
      <div className="relative z-10 bg-[#F7FBFC]">
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

        {/* Server-rendered About/Services — crawlable text + internal links */}
        <SeoContentSection seo={seo} />

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

        {/* How It Works — Process Timeline */}
        <div className="reveal">
          <ProcessTimeline />
        </div>
        
        <div className="reveal">
          <PricingSection />
        </div>

        {/* FAQ Section */}
        <div className="reveal">
          <FAQSection />
        </div>

        {/* Booking Form Section */}
        <div className="reveal">
          <BookingForm />
        </div>

        {/* Instagram Feed */}
        <div className="reveal">
          <InstagramFeed />
        </div>

        {/* Footer */}
        <Footer config={config} />
      </div>
    </main>
  );
}
