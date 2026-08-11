'use client';

import { SWRConfig } from 'swr';
import type { SiteConfig, Category } from '@/lib/types';

interface SWRProviderProps {
  config: SiteConfig | null;
  categories: Category[];
  children: React.ReactNode;
}

/**
 * SWR cache ko server ke data se pehle hi bhar deta hai.
 *
 * Root layout `/config` aur `/categories` server par fetch karta hai
 * (dono ISR-cached, isliye practically muft). Wahi data yaha `fallback`
 * me chala jaata hai, to jab browser me Navbar/Footer/BottomNav jaise
 * component `useSiteConfig()` call karte hain, unhe data cache me pehle
 * se mil jaata hai — hydration ke baad koi network request nahi jaati.
 *
 * Pehle ye chaar request (`/config`, `/categories`, `/testimonials`,
 * `/photos?limit=6`) har page load par jaati thi, wo bhi UNKA data
 * dikhane ke liye jo server pehle hi bhej chuka tha. Slow mobile
 * network par yahi wo daudti hui spinners thi jo page ko "load ho raha
 * hai" jaisa feel karati thi.
 *
 * Admin panel is fallback se toota nahi: uske apne `useSWR` calls
 * normal tarike se revalidate karte hain, to waha data hamesha taaza
 * rehta hai — bas pehla paint turant ho jaata hai.
 */
export default function SWRProvider({ config, categories, children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          '/config': config ?? undefined,
          '/categories': categories,
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
