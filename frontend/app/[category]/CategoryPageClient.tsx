'use client';

import { useState, useCallback } from 'react';
import useSWRInfinite from 'swr/infinite';
import Navbar from '@/components/Navbar';
import PhotoGrid from '@/components/PhotoGrid';
import Lightbox from '@/components/Lightbox';
import InfiniteScroll from '@/components/InfiniteScroll';
import { fetcher } from '@/lib/fetcher';
import type { Photo, Category, PaginatedPhotos } from '@/lib/types';

interface Props {
  category: Category;
  initialPhotos: Photo[];
  initialPagination: PaginatedPhotos['pagination'] | null;
}

export default function CategoryPageClient({ category, initialPhotos, initialPagination }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const getKey = (pageIndex: number, previousPageData: PaginatedPhotos | null) => {
    if (previousPageData && !previousPageData.pagination.hasMore) return null;
    return `/photos?category=${category.slug}&page=${pageIndex + 1}&limit=20`;
  };

  const { data, setSize, isValidating } = useSWRInfinite<PaginatedPhotos>(
    getKey,
    fetcher,
    {
      fallbackData: initialPagination ? [{ photos: initialPhotos, pagination: initialPagination }] : undefined,
      revalidateOnFocus: false,
      revalidateFirstPage: false,
    }
  );

  const allPhotos = data ? data.flatMap((page) => page.photos) : initialPhotos;
  const hasMore = data ? data[data.length - 1]?.pagination?.hasMore ?? false : false;
  const isLoading = isValidating;

  const loadMore = useCallback(() => {
    setSize((prev) => prev + 1);
  }, [setSize]);

  const openLightbox = (photo: Photo) => {
    const index = allPhotos.findIndex((p) => p._id === photo._id);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxOpen(true);
  };

  return (
    <main>
      <Navbar />

      {/* Category Header */}
      <div className="pt-28 md:pt-36 pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-text-primary animate-fade-in">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-3 font-body text-sm md:text-base text-text-muted max-w-2xl animate-fade-in-up">
              {category.description}
            </p>
          )}
          <div className="mt-4 font-body text-xs tracking-[0.2em] uppercase text-text-muted animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {initialPagination?.total || 0} photos
          </div>
        </div>
      </div>

      {/* Photo Grid with Infinite Scroll */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <InfiniteScroll
          onLoadMore={loadMore}
          hasMore={hasMore}
          isLoading={isLoading}
        >
          <PhotoGrid photos={allPhotos} onPhotoClick={openLightbox} />
        </InfiniteScroll>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          photos={allPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}
    </main>
  );
}
