import type { Photo } from '@/lib/types';

// Simple global client-side store to share preloaded photos from home page to category page
const store: {
  photosByCategory: Record<string, Photo[]>;
} = {
  photosByCategory: {},
};

export function setPreloadedCategoryPhotos(categorySlug: string, photos: Photo[]) {
  if (typeof window === 'undefined') return;
  store.photosByCategory[categorySlug] = photos;
}

export function getPreloadedCategoryPhotos(categorySlug: string): Photo[] | null {
  if (typeof window === 'undefined') return null;
  return store.photosByCategory[categorySlug] || null;
}
