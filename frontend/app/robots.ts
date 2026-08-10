import type { MetadataRoute } from 'next';
import { getSeo, SITE_URL } from '@/lib/seo';

export const revalidate = 3600;

/**
 * Dynamic robots.txt.
 *
 * Admin panel me "Allow search engines" band karte hi poori site
 * noindex ho jaati hai — staging ya coming-soon phase ke liye useful.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeo();

  // Private routes — inhe kabhi index nahi hona chahiye.
  const privatePaths = ['/admin', '/admin/', '/client/', '/api/'];

  if (!seo.allow_indexing) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      host: SITE_URL,
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
      // Image crawlers ko photos explicitly allow karo — portfolio site
      // ka aadha traffic Google Images se aata hai.
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
        disallow: ['/admin/', '/client/'],
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/image-sitemap.xml`],
    host: SITE_URL,
  };
}
