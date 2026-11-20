import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Raleway } from 'next/font/google';
import './globals.css';

import BackendPing from '@/components/BackendPing';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import BottomNav from '@/components/BottomNav';
import BokehBackground from '@/components/BokehBackground';
import CameraCursor from '@/components/CameraCursor';
import ScrollProgressBar from '@/components/ScrollProgressBar';
import ScrollRevealProvider from '@/components/ScrollRevealProvider';
import LenisProvider from '@/components/LenisProvider';
import JsonLd from '@/components/JsonLd';
import { SpeedInsights } from '@vercel/speed-insights/next';

import SWRProvider from '@/components/SWRProvider';

import { getSeo, buildMetadata, buildSchemaGraph } from '@/lib/seo';
import { getSiteConfig, getCategories } from '@/lib/siteData';

/* ─── Fonts ─────────────────────────────────────────────────────────
   Do fonts: Cormorant (editorial serif) headings ke liye, Raleway body
   ke liye. Do-font pairing se page instantly premium lagta hai —
   single-font sites hamesha template jaisi dikhti hain.               */
const raleway = Raleway({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-raleway',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'block',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7FBFC' },
    { media: '(prefers-color-scheme: dark)', color: '#142433' },
  ],
  colorScheme: 'light',
};

/**
 * Site-wide metadata. Poora content admin panel se aata hai — jo blank
 * ho wo backend ka auto-SEO engine bhar deta hai.
 */
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo();

  return {
    ...buildMetadata(seo, {
      title: seo.meta_title,
      description: seo.meta_description,
      path: '/',
    }),
    // `absolute` — koi template nahi. Pages apna poora title khud dete hain
    // (backend title_template lagata hai), isliye yaha dobara template
    // lagane se brand ka naam duplicate ho jaata tha.
    title: { absolute: seo.meta_title },
    // favicon.ico app/ folder se auto pick hoti hai — yaha sirf
    // apple-touch-icon declare karna hai.
    icons: {
      apple: [{ url: '/icon-192.png', sizes: '192x192' }],
    },
    manifest: '/manifest.webmanifest',
    // formatDetection yaha jaan-bujh kar set nahi kiya: Next har mention
    // ki hui key ko `=no` likh deta hai (value chahe true ho), jisse mobile
    // par tap-to-call/tap-to-map band ho jaata. Browser ka default hi sahi hai.
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* Teeno parallel — ek doosre par depend nahi karte, aur teeno
     ISR-cached hain. Series me karne se TTFB me faltu round-trips
     jud jaate. */
  const [seo, config, categories] = await Promise.all([
    getSeo(),
    getSiteConfig(),
    getCategories(),
  ]);
  const schema = buildSchemaGraph(seo);

  return (
    <html
      lang="en-IN"
      className={`js ${raleway.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Cloudinary CDN se pehle connect karo — images fast load hongi */}
        <link
          rel="preconnect"
          href="https://res.cloudinary.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Paint se PEHLE `js` aur `no-intro` guard lagti hai.
            Agar user ne is session me pehle intro dekh liya ho, to
            `no-intro` paint se pehle lag jata hai jisse shutter
            1 frame ke liye bhi black blink nahi karta. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('scrollRestoration' in history){history.scrollRestoration='manual';}try{if(sessionStorage.getItem('niks_intro_played')==='1'||window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('no-intro');}}catch(e){}window.scrollTo(0,0);window.addEventListener('beforeunload',function(){try{sessionStorage.removeItem('niks_intro_played');}catch(e){}});window.addEventListener('pagehide',function(){try{sessionStorage.removeItem('niks_intro_played');}catch(e){}});`,
          }}
        />
      </head>
      <body className="font-body antialiased bg-background text-ink overflow-x-hidden min-h-screen">
        {/* Site-wide structured data: LocalBusiness + WebSite + Person */}
        <JsonLd id="site-schema" data={schema} />

        <SWRProvider config={config} categories={categories}>
          <LenisProvider>
            <BokehBackground />
            <CameraCursor />
            <ScrollProgressBar />
            <BackendPing />
            {children}
            <BottomNav />
            <ScrollRevealProvider />
            <ServiceWorkerRegister />
            {process.env.NODE_ENV === 'production' && <SpeedInsights />}
          </LenisProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
