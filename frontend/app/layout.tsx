import type { Metadata, Viewport } from 'next';
import BackendPing from '@/components/BackendPing';
import { Raleway } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import BottomNav from '@/components/BottomNav';
import { SpeedInsights } from "@vercel/speed-insights/next";

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-raleway',
  display: 'swap',
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface ConfigResponse {
  photographer_name?: string;
  about_text?: string;
  hero_photo?: {
    public_id: string;
  } | null;
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export async function generateMetadata(): Promise<Metadata> {
  let config: ConfigResponse | null = null;

  try {
    const res = await fetch(`${API_URL}/config`, { next: { revalidate: 300 } });
    if (res.ok) {
      config = await res.json();
    }
  } catch {
    // Use fallback values
  }

  const photographerName = config?.photographer_name || 'Photographer';
  const title = `${photographerName} | Photography`;
  const description = config?.about_text
    ? config.about_text.substring(0, 160)
    : 'Professional photography portfolio showcasing stunning visual storytelling';

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const ogImage = config?.hero_photo?.public_id && cloudName
    ? `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,h_630,c_fill,q_auto,f_auto/${config.hero_photo.public_id}`
    : undefined;

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: SITE_URL,
      ...(ogImage && {
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={raleway.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="font-body antialiased pb-20 md:pb-0">
        <BackendPing />
        {children}
        <BottomNav />
        <ServiceWorkerRegister />
        <SpeedInsights />
      </body>
    </html>
  );
}
