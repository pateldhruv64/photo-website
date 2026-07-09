import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Photography Portfolio',
    short_name: 'Portfolio',
    description: 'Professional photography portfolio showcasing stunning visual storytelling',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1A1A1A',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
