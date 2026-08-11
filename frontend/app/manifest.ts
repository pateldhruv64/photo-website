import type { MetadataRoute } from 'next';
import { getSeo } from '@/lib/seo';

export const revalidate = 3600;

/**
 * PWA manifest — naam/description admin ke SEO settings se aata hai,
 * to "Add to home screen" par bhi sahi branding dikhti hai.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const seo = await getSeo();

  return {
    name: seo.meta_title,
    short_name: seo.brand.slice(0, 12),
    description: seo.meta_description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F7FBFC',
    theme_color: '#142433',
    categories: ['photography', 'lifestyle', 'business'],
    lang: 'en-IN',
    /* Maskable icon alag file hai. Android install ki hui icon ko
       circle/squircle me kaatta hai — pehle yahi `icon-512` maskable ke
       roop me diya tha, jiske safed rounded corners kat jaate the aur
       kinare par safed lakeer dikhti thi. `icon-maskable-512` full-bleed
       dark hai aur camera glyph safe zone ke andar hai, to kisi bhi
       shape me saaf katta hai. */
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
