import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const revalidate = 3600;

interface SitemapCategory {
  slug: string;
  name: string;
  last_modified: string | null;
  photo_count: number;
}

/**
 * Page sitemap. Photos ka alag image-sitemap.xml hai — Google dono
 * ko robots.txt se pick karta hai.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}`, lastModified: now, changeFrequency: 'daily', priority: 1 },
  ];

  try {
    const res = await fetch(`${API_URL}/sitemap`, { next: { revalidate: 3600, tags: ['seo'] } });
    if (!res.ok) return staticRoutes;

    const data = (await res.json()) as {
      allow_indexing?: boolean;
      categories?: SitemapCategory[];
    };

    // Admin ne indexing band ki hai — sitemap khaali bhejo
    if (data.allow_indexing === false) return [];

    const categoryRoutes: MetadataRoute.Sitemap = (data.categories || []).map((c) => ({
      url: `${SITE_URL}/${c.slug}`,
      lastModified: c.last_modified ? new Date(c.last_modified) : now,
      changeFrequency: 'weekly' as const,
      // Jis gallery me zyada kaam hai use zyada priority — crawler
      // waha pehle jaata hai.
      priority: c.photo_count >= 20 ? 0.9 : c.photo_count > 0 ? 0.8 : 0.5,
    }));

    return [...staticRoutes, ...categoryRoutes];
  } catch {
    return staticRoutes;
  }
}
