'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { SiteConfig, Category } from '@/lib/types';

/**
 * ─────────────────────────────────────────────────────────────────────
 *  SITE-WIDE DATA HOOKS
 * ─────────────────────────────────────────────────────────────────────
 *  `/config` aur `/categories` har public page ke chhote-chhote hisson
 *  ko chahiye — navbar, footer, bottom nav, booking form, lightbox.
 *  Pehle in me se har component apna `useSWR('/config', ...)` likhta
 *  tha, apne options ke saath. Do dikkat thi:
 *
 *    1. Wahi options (revalidateOnFocus, dedupingInterval) aath jagah
 *       copy-paste the. Ek badalna ho to aath jagah badalna padta.
 *    2. Server yeh data pehle hi HTML me bhej chuka hota hai, phir bhi
 *       hydration ke turant baad browser dobara maangta tha.
 *
 *  Ab dono hooks yaha hain aur `revalidateIfStale: false` lagate hain.
 *  Cache SWRProvider se server ke data se pehle hi bhara hua aata hai,
 *  isliye yeh hooks aam taur par EK BHI network request nahi karte.
 *
 *  Data baasi nahi hota: page khud ISR par hai (60s), aur admin ke save
 *  karte hi /api/revalidate poora cache naya kar deta hai. Yaani browser
 *  ko poll karne ki koi zaroorat hi nahi.
 *
 *  Note: admin panel jaan-bujh kar in hooks ko use NAHI karta — waha
 *  apne `useSWR` calls hain jo normal tarike se revalidate hote hain,
 *  kyunki admin ko hamesha taaza data chahiye.
 */

const STATIC_DATA = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
} as const;

/** Site configuration — brand name, socials, WhatsApp number, navbar links. */
export function useSiteConfig(fallbackData?: SiteConfig | null) {
  const { data } = useSWR<SiteConfig>('/config', fetcher, {
    ...STATIC_DATA,
    fallbackData: fallbackData ?? undefined,
  });
  return data;
}

/** Active categories, navbar order me. */
export function useCategories(fallbackData?: Category[]) {
  const { data } = useSWR<Category[]>('/categories', fetcher, {
    ...STATIC_DATA,
    fallbackData,
  });
  return data;
}
