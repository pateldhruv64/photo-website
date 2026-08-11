import type { SiteConfig, Category } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * ─────────────────────────────────────────────────────────────────────
 *  SERVER-SIDE SITE DATA
 * ─────────────────────────────────────────────────────────────────────
 *  Root layout in dono ko fetch karke SWR cache me daal deta hai
 *  (dekho components/SWRProvider.tsx), taki client par yeh request
 *  dobara na jaayein.
 *
 *  Dono ISR-cached hain aur admin save karte hi `seo` tag revalidate ho
 *  jaata hai, isliye har visitor par backend hit nahi hota — chahe
 *  hazaar log ek saath aayein.
 *
 *  Backend down ho to yeh `null`/`[]` deti hain, throw nahi karti:
 *  navbar bina custom links ke bhi dikhna chahiye, poora page nahi
 *  girna chahiye.
 */

/** Site configuration — brand name, socials, WhatsApp number, navbar links. */
export async function getSiteConfig(): Promise<SiteConfig | null> {
  try {
    const res = await fetch(`${API_URL}/config`, {
      next: { revalidate: 300, tags: ['seo'] },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Active categories, navbar order me. */
export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 3600, tags: ['seo'] },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
