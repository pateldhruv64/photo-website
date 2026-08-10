/**
 * ─────────────────────────────────────────────────────────────────────
 *  SEO CORE
 * ─────────────────────────────────────────────────────────────────────
 *  Ek hi jagah se poori site ka SEO control hota hai:
 *
 *    getSeo()          → backend se resolved SEO payload (cached)
 *    buildMetadata()   → Next.js Metadata object
 *    buildSchemaGraph()→ JSON-LD @graph (LocalBusiness, WebSite, Person…)
 *
 *  Backend blank fields auto-fill karta hai, aur yaha bhi har jagah
 *  fallback hai — matlab DB down ho tab bhi meta tags kabhi khaali nahi.
 */

import type { Metadata } from 'next';
import { ogImageUrl, seoImageUrl } from '@/lib/cloudinary';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

// ─── Types ───────────────────────────────────────────────────────────

export interface SeoBusiness {
  type: string;
  name: string;
  legal_name: string;
  founder: string;
  description: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  map_url: string;
  logo_url: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  price_range: string;
  founding_year: string;
  service_areas: string[];
  opening_hours: string[];
  services: string[];
  social_profiles: string[];
}

export interface SeoCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  intro_text: string;
  cover_public_id: string;
  updated_at: string | null;
  title: string;
  keywords: string[];
}

export interface SeoPayload {
  brand: string;
  location: string;
  meta_title: string;
  meta_description: string;
  title_template: string;
  keywords: string[];
  og_image_public_id: string;
  og_image_url: string;
  twitter_handle: string;
  google_site_verification: string;
  bing_site_verification: string;
  allow_indexing: boolean;
  custom_head_scripts: string;
  business: SeoBusiness;
  stats: {
    photo_count: number;
    video_count: number;
    category_count: number;
    review_count: number;
    rating_value: number | null;
  };
  categories: SeoCategory[];
}

// ─── Hard fallback (backend down ho to bhi meta tags valid rahen) ────

const FALLBACK: SeoPayload = {
  brand: 'Photography Studio',
  location: '',
  meta_title: 'Professional Photography Portfolio',
  meta_description:
    'Professional wedding, pre-wedding, portrait and event photography. Candid storytelling, cinematic edits and fast delivery. View the portfolio and book your date.',
  title_template: '%s | Photography Studio',
  keywords: ['photographer', 'photography', 'wedding photographer', 'portfolio'],
  og_image_public_id: '',
  og_image_url: '',
  twitter_handle: '',
  google_site_verification: '',
  bing_site_verification: '',
  allow_indexing: true,
  custom_head_scripts: '',
  business: {
    type: 'ProfessionalService',
    name: 'Photography Studio',
    legal_name: 'Photography Studio',
    founder: '',
    description: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    map_url: '',
    logo_url: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'IN',
    latitude: null,
    longitude: null,
    price_range: '₹₹',
    founding_year: '',
    service_areas: [],
    opening_hours: [],
    services: [],
    social_profiles: [],
  },
  stats: {
    photo_count: 0,
    video_count: 0,
    category_count: 0,
    review_count: 0,
    rating_value: null,
  },
  categories: [],
};

// ─── Fetch ───────────────────────────────────────────────────────────

/**
 * Backend se resolved SEO payload. 5 min ISR — admin save karte hi
 * /api/revalidate trigger hota hai, to change turant live ho jaata hai.
 */
export async function getSeo(): Promise<SeoPayload> {
  try {
    const res = await fetch(`${API_URL}/seo`, {
      next: { revalidate: 300, tags: ['seo'] },
    });
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as Partial<SeoPayload>;
    return {
      ...FALLBACK,
      ...data,
      business: { ...FALLBACK.business, ...(data.business || {}) },
      stats: { ...FALLBACK.stats, ...(data.stats || {}) },
      categories: data.categories || [],
    };
  } catch {
    return FALLBACK;
  }
}

// ─── Metadata builders ───────────────────────────────────────────────

const absolute = (path: string) =>
  path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const pickOgImage = (seo: SeoPayload, publicId?: string): string | null => {
  const id = publicId || seo.og_image_public_id;
  if (id) return ogImageUrl(id);
  if (seo.og_image_url) return seo.og_image_url;
  return null;
};

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  imagePublicId?: string;
  keywords?: string[];
  /** Admin ne indexing band ki ho ya page private ho (admin/client gallery) */
  noindex?: boolean;
  type?: 'website' | 'article' | 'profile';
}

/**
 * Kisi bhi page ka poora Metadata object banao — canonical, OG, Twitter,
 * robots directives aur verification tags ke saath.
 */
export function buildMetadata(seo: SeoPayload, page: PageMetaInput): Metadata {
  const url = absolute(page.path);
  const image = pickOgImage(seo, page.imagePublicId);
  const indexable = seo.allow_indexing && !page.noindex;
  const keywords = page.keywords?.length ? page.keywords : seo.keywords;

  return {
    metadataBase: new URL(SITE_URL),
    // `absolute` isliye — backend already title_template apply kar chuka hai.
    // Iske bina Next apna template dobara lagata hai aur brand ka naam
    // do baar aa jaata hai: "Wedding Photography | Brand | Brand".
    title: { absolute: page.title },
    description: page.description,
    keywords,
    applicationName: seo.brand,
    authors: [{ name: seo.business.founder || seo.brand }],
    creator: seo.business.founder || seo.brand,
    publisher: seo.brand,
    category: 'Photography',
    alternates: { canonical: url },
    robots: indexable
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            // Google ko poora image preview aur bada snippet dikhane do —
            // photography site ke liye yeh CTR ka sabse bada lever hai.
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        }
      : { index: false, follow: false, nocache: true },
    verification: {
      ...(seo.google_site_verification && { google: seo.google_site_verification }),
      ...(seo.bing_site_verification && {
        other: { 'msvalidate.01': seo.bing_site_verification },
      }),
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      siteName: seo.brand,
      locale: 'en_IN',
      type: page.type || 'website',
      ...(image && {
        images: [{ url: image, width: 1200, height: 630, alt: page.title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      ...(seo.twitter_handle && {
        site: seo.twitter_handle,
        creator: seo.twitter_handle,
      }),
      ...(image && { images: [image] }),
    },
    other: {
      // Local SEO ke geo signals — kuch crawlers aaj bhi inhe padhte hain
      ...(seo.business.city && { 'geo.placename': seo.business.city }),
      ...(seo.business.state && { 'geo.region': `${seo.business.country}-${seo.business.state}` }),
      ...(seo.business.latitude != null &&
        seo.business.longitude != null && {
          'geo.position': `${seo.business.latitude};${seo.business.longitude}`,
          ICBM: `${seo.business.latitude}, ${seo.business.longitude}`,
        }),
    },
  };
}

// ─── JSON-LD schema graph ────────────────────────────────────────────

type Node = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#business`;
const SITE_ID = `${SITE_URL}/#website`;
const PERSON_ID = `${SITE_URL}/#photographer`;

/** LocalBusiness / ProfessionalService — Google Business Profile ka backbone. */
function businessNode(seo: SeoPayload): Node {
  const b = seo.business;
  const node: Node = {
    '@type': [b.type || 'ProfessionalService', 'LocalBusiness'],
    '@id': ORG_ID,
    name: b.name,
    legalName: b.legal_name || b.name,
    url: SITE_URL,
    description: b.description || seo.meta_description,
    priceRange: b.price_range,
    ...(b.logo_url && {
      logo: { '@type': 'ImageObject', url: b.logo_url },
      image: b.logo_url,
    }),
    ...(!b.logo_url &&
      seo.og_image_public_id && { image: seoImageUrl(seo.og_image_public_id) }),
    ...(b.email && { email: b.email }),
    ...(b.phone && { telephone: b.phone }),
    ...(b.founding_year && { foundingDate: b.founding_year }),
    ...(b.social_profiles.length && { sameAs: b.social_profiles }),
    ...(b.map_url && { hasMap: b.map_url }),
  };

  // Address tabhi daalo jab kuch to bhara ho — adhoora address schema
  // error deta hai Search Console me.
  if (b.street_address || b.city || b.postal_code) {
    node.address = {
      '@type': 'PostalAddress',
      ...(b.street_address && { streetAddress: b.street_address }),
      ...(b.city && { addressLocality: b.city }),
      ...(b.state && { addressRegion: b.state }),
      ...(b.postal_code && { postalCode: b.postal_code }),
      addressCountry: b.country || 'IN',
    };
  }

  if (b.latitude != null && b.longitude != null) {
    node.geo = { '@type': 'GeoCoordinates', latitude: b.latitude, longitude: b.longitude };
  }

  if (b.opening_hours.length) {
    node.openingHours = b.opening_hours;
  }

  if (b.service_areas.length) {
    node.areaServed = b.service_areas.map((area) => ({ '@type': 'City', name: area }));
  }

  if (b.founder) {
    node.founder = { '@id': PERSON_ID };
  }

  // Services ko OfferCatalog banao — "wedding photography" jaisi queries
  // par entity match strong hota hai.
  const services = b.services.length
    ? b.services
    : seo.categories.map((c) => `${c.name} Photography`);
  if (services.length) {
    node.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: `${b.name} — Photography Services`,
      itemListElement: services.map((s, i) => ({
        '@type': 'Offer',
        position: i + 1,
        itemOffered: { '@type': 'Service', name: s, provider: { '@id': ORG_ID } },
      })),
    };
  }

  if (seo.stats.rating_value && seo.stats.review_count > 0) {
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: seo.stats.rating_value,
      reviewCount: seo.stats.review_count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return node;
}

/** WebSite + sitelinks searchbox potential. */
function websiteNode(seo: SeoPayload): Node {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE_URL,
    name: seo.brand,
    description: seo.meta_description,
    inLanguage: 'en-IN',
    publisher: { '@id': ORG_ID },
  };
}

/** Photographer as a Person entity — knowledge panel ke liye. */
function personNode(seo: SeoPayload): Node | null {
  const name = seo.business.founder;
  if (!name) return null;
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name,
    jobTitle: 'Photographer',
    url: SITE_URL,
    worksFor: { '@id': ORG_ID },
    ...(seo.business.social_profiles.length && { sameAs: seo.business.social_profiles }),
    ...(seo.business.city && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: seo.business.city,
        ...(seo.business.state && { addressRegion: seo.business.state }),
        addressCountry: seo.business.country || 'IN',
      },
    }),
  };
}

export function breadcrumbNode(trail: Array<{ name: string; path: string }>): Node {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

export interface GalleryImage {
  public_id: string;
  alt?: string;
  title?: string;
  caption?: string;
}

/** ImageGallery + ImageObject list — Google Images me photos index hoti hain. */
export function imageGalleryNode(
  seo: SeoPayload,
  opts: { name: string; description: string; path: string; images: GalleryImage[] }
): Node {
  return {
    '@type': 'ImageGallery',
    '@id': `${absolute(opts.path)}#gallery`,
    name: opts.name,
    description: opts.description,
    url: absolute(opts.path),
    isPartOf: { '@id': SITE_ID },
    // 30 se zyada ImageObject daalne se payload bhaari ho jaata hai
    // aur crawl budget bekaar jaata hai.
    associatedMedia: opts.images.slice(0, 30).map((img) => ({
      '@type': 'ImageObject',
      contentUrl: seoImageUrl(img.public_id),
      thumbnailUrl: seoImageUrl(img.public_id, 600),
      name: img.title || img.alt || opts.name,
      description: img.caption || img.alt || opts.description,
      creditText: seo.brand,
      creator: { '@id': seo.business.founder ? PERSON_ID : ORG_ID },
      copyrightNotice: `© ${new Date().getFullYear()} ${seo.brand}`,
      license: `${SITE_URL}/`,
      acquireLicensePage: `${SITE_URL}/#booking-section`,
    })),
  };
}

export function faqNode(faqs: Array<{ question: string; answer: string }>): Node {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/**
 * Site-wide schema graph. Root layout me ek baar inject hota hai,
 * baaki pages sirf apne page-specific nodes add karte hain.
 */
export function buildSchemaGraph(seo: SeoPayload, extraNodes: Node[] = []): Node {
  const nodes: Node[] = [businessNode(seo), websiteNode(seo)];
  const person = personNode(seo);
  if (person) nodes.push(person);
  nodes.push(...extraNodes);

  return { '@context': 'https://schema.org', '@graph': nodes };
}

/**
 * JSON-LD ko script tag me daalne ke liye safe string.
 * `<` escape karna zaroori hai warna koi injected string tag tod sakti hai.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
