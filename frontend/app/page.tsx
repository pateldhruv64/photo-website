import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import HomeGallery from '@/components/HomeGallery';
import Marquee from '@/components/Marquee';
import Footer from '@/components/Footer';
import StickyRevealFooter from '@/components/ui/StickyRevealFooter';
import dynamic from 'next/dynamic';

/* ─── Below-the-fold sections ────────────────────────────────────────
   Pehle in sab par `ssr: false` tha. Iska matlab tha:

     - Server ki HTML me yeh sections hote hi NAHI the
     - Browser pehle khaali rang ke boxes dikhata tha
     - Phir JS download → parse → hydrate → tab content aata tha

   Isi wajah se site "loading wali glitch" jaisi lagti thi, aur Google ko
   pricing/FAQ/testimonials ka koi text bhi nahi milta tha.

   Ab default (ssr on) hai: content pehli hi HTML response me aata hai.
   `dynamic()` abhi bhi code-split karta hai — JS alag chunk me hi
   rehta hai — bas pehla paint ab khaali nahi hota.                    */
const TestimonialsSection = dynamic(() => import('@/components/TestimonialsSection'));
const StatsSection = dynamic(() => import('@/components/StatsSection'));
const PricingSection = dynamic(() => import('@/components/PricingSection'));
const HelixSection = dynamic(() => import('@/components/HelixSection'));
const BookingForm = dynamic(() => import('@/components/BookingForm'));
const ProcessTimeline = dynamic(() => import('@/components/ProcessTimeline'));
const FAQSection = dynamic(() => import('@/components/FAQSection'));
const InstagramFeed = dynamic(() => import('@/components/InstagramFeed'));
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
import type { SiteConfig, Category, Photo, VideoItem, Testimonial } from '@/lib/types';

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
  testimonials?: Testimonial[];
  pagination?: { page: number; limit: number; total: number; hasMore: boolean };
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

      {/* Content that scrolls over the hero and over the revealed footer */}
      <div className="relative z-10 bg-[#F7FBFC] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)]">
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
        <HomeGallery
          categories={categories}
          initialPhotos={initialPhotos}
          initialVideos={initialVideos}
          initialPagination={data?.pagination}
        />

        {/* Server-rendered About/Services — crawlable text + internal links */}
        <SeoContentSection seo={seo} />

        {/* 3D Spatial Helix Card Carousel */}
        <HelixSection initialPhotos={initialPhotos} />

        {/* Testimonials Section */}
        <TestimonialsSection initialTestimonials={data?.testimonials} />

        <StatsSection />

        {/* How It Works — Process Timeline */}
        <ProcessTimeline />
        
        <PricingSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* Booking Form Section */}
        <BookingForm />

        {/* Instagram Feed — photos server se hi mil jaati hain */}
        <InstagramFeed photos={initialPhotos} />
      </div>

      {/* Sticky Reveal Footer — Zero Dependency, 120fps motion */}
      <StickyRevealFooter>
        <Footer config={config} categories={categories} />
      </StickyRevealFooter>
    </main>
  );
}
