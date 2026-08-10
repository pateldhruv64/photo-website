import type { Metadata } from 'next';

/**
 * Client galleries password-protected aur private hoti hain.
 * Inhe kabhi index nahi hona chahiye — client ki private photos
 * Google me aa jaana serious privacy problem hai.
 */
export const metadata: Metadata = {
  title: 'Private Gallery',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function ClientGalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
