import { SITE_URL } from '@/lib/seo';
import { seoImageUrl } from '@/lib/cloudinary';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const revalidate = 3600;

interface SitemapImage {
  public_id: string;
  title: string;
  caption: string;
  alt: string;
}

interface SitemapCategory {
  slug: string;
  name: string;
  images: SitemapImage[];
}

/** XML me &, <, > wagairah escape karna zaroori hai warna sitemap invalid ho jaata hai. */
const esc = (s: string) =>
  (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * GET /image-sitemap.xml
 *
 * Google Images ka dedicated sitemap. Next.js ka built-in sitemap helper
 * abhi `<image:image>` namespace support nahi karta, isliye raw XML
 * khud generate kar rahe hain. Photography site ke liye yeh sabse bada
 * organic traffic source hai.
 */
export async function GET() {
  let categories: SitemapCategory[] = [];
  let allowIndexing = true;

  try {
    const res = await fetch(`${API_URL}/sitemap`, { next: { revalidate: 3600, tags: ['seo'] } });
    if (res.ok) {
      const data = await res.json();
      allowIndexing = data.allow_indexing !== false;
      categories = data.categories || [];
    }
  } catch {
    // Backend down — khaali par valid sitemap bhejte hain
  }

  const urls = !allowIndexing
    ? []
    : categories
        .filter((c) => c.images?.length)
        .map((c) => {
          const images = c.images
            .map(
              (img) => `    <image:image>
      <image:loc>${esc(seoImageUrl(img.public_id))}</image:loc>
      <image:title>${esc(img.title || c.name)}</image:title>
      <image:caption>${esc(img.caption || img.alt)}</image:caption>
    </image:image>`
            )
            .join('\n');

          return `  <url>
    <loc>${esc(`${SITE_URL}/${c.slug}`)}</loc>
${images}
  </url>`;
        });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
