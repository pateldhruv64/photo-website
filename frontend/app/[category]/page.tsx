import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryPageClient from './CategoryPageClient';
import JsonLd from '@/components/JsonLd';
import {
  getSeo,
  buildMetadata,
  breadcrumbNode,
  imageGalleryNode,
  SITE_URL,
} from '@/lib/seo';
import type { Category, Photo, SiteConfig, VideoItem } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Props {
  params: { category: string };
}

interface CategoryPageData {
  category: Category;
  seo: { title: string; description: string; keywords: string[] };
  config: SiteConfig;
  photos: Photo[];
  videos: VideoItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

/**
 * Ek hi call me category ka poora SSR payload. Pehle yeh page fully
 * client-side fetch karta tha — matlab Google ko khaali HTML milti thi
 * aur ek bhi photo index nahi hoti thi. Ab sab server par render hota hai.
 */
async function getCategoryPage(slug: string): Promise<CategoryPageData | null> {
  try {
    const res = await fetch(`${API_URL}/category/${encodeURIComponent(slug)}?limit=24`, {
      next: { revalidate: 120, tags: ['seo'] },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Active categories ko build time par pre-render karo — fastest TTFB. */
export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const categories: Category[] = await res.json();
    return categories
      .filter((c) => c.is_active)
      .map((c) => ({ category: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [data, seo] = await Promise.all([getCategoryPage(params.category), getSeo()]);

  if (!data) {
    // Note: Next 14 me streaming SSR ke kaaran `notFound()` yaha 404 status
    // set nahi kar paata (response headers pehle hi ja chuke hote hain) —
    // page 200 ke saath not-found UI dikhata hai. Isliye `noindex` yaha
    // zaroori hai: Google is URL ko index nahi karega.
    // `dynamicParams = false` se asli 404 milta, par phir admin se banayi
    // nayi category agle deploy tak 404 deti — wo bada nuksaan hai.
    return {
      title: 'Gallery Not Found',
      robots: { index: false, follow: true },
    };
  }

  // Cover photo > pehli photo — OG card kabhi khaali nahi jaana chahiye
  const ogPublicId =
    data.category.cover_photo?.public_id || data.photos[0]?.public_id || undefined;

  return buildMetadata(seo, {
    title: data.seo.title,
    description: data.seo.description,
    path: `/${params.category}`,
    imagePublicId: ogPublicId,
    keywords: data.seo.keywords,
  });
}

export default async function CategoryPage({ params }: Props) {
  const [data, seo] = await Promise.all([getCategoryPage(params.category), getSeo()]);

  if (!data) notFound();

  const { category, photos, videos, pagination, config } = data;
  const photoCount = pagination.total;

  const pageSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbNode([
        { name: 'Home', path: '/' },
        { name: category.name, path: `/${category.slug}` },
      ]),
      imageGalleryNode(seo, {
        name: data.seo.title,
        description: data.seo.description,
        path: `/${category.slug}`,
        images: photos.map((p) => ({
          public_id: p.public_id,
          title: p.title,
          alt: p.alt_text,
          caption: p.caption,
        })),
      }),
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/${category.slug}#webpage`,
        url: `${SITE_URL}/${category.slug}`,
        name: data.seo.title,
        description: data.seo.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#business` },
        inLanguage: 'en-IN',
        ...(photoCount > 0 && {
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: photoCount,
            name: `${category.name} photography portfolio`,
          },
        }),
      },
    ],
  };

  return (
    <>
      <JsonLd id="category-schema" data={pageSchema} />
      <CategoryPageClient
        categorySlug={params.category}
        category={category}
        initialPhotos={photos}
        initialPagination={pagination}
        initialVideos={videos}
        initialConfig={config}
        seoDescription={data.seo.description}
        introText={category.intro_text || category.description || ''}
        photoCount={photoCount}
        brand={seo.brand}
        location={seo.location}
      />
    </>
  );
}
