'use client';

import { useState, useCallback } from 'react';
import useSWRInfinite from 'swr/infinite';
import PhotoGrid from './PhotoGrid';
import Lightbox from './Lightbox';
import InfiniteScroll from './InfiniteScroll';
import { fetcher } from '@/lib/fetcher';
import type { Category, Photo, PaginatedPhotos } from '@/lib/types';

interface Props {
  categories: Category[];
  initialPhotos?: Photo[]; // We can pass initial photos for 'all' to avoid flash
}

export default function HomeGallery({ categories, initialPhotos = [] }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const activeSlug = activeCategory === 'all' ? '' : categories.find(c => c._id === activeCategory)?.slug;

  const getKey = (pageIndex: number, previousPageData: PaginatedPhotos | null) => {
    if (previousPageData && !previousPageData.pagination.hasMore) return null;
    const catQuery = activeSlug ? `category=${activeSlug}&` : '';
    return `/photos?${catQuery}page=${pageIndex + 1}&limit=20`;
  };

  const { data, setSize, isValidating } = useSWRInfinite<PaginatedPhotos>(
    getKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
    }
  );

  // If we haven't fetched data yet, use initialPhotos if we're on 'all', otherwise empty array
  const currentPhotos = data 
    ? data.flatMap((page) => page.photos) 
    : (activeCategory === 'all' ? initialPhotos : []);
    
  const hasMore = data ? data[data.length - 1]?.pagination?.hasMore ?? false : false;
  const isLoading = isValidating;

  const loadMore = useCallback(() => {
    setSize((prev) => prev + 1);
  }, [setSize]);

  const openLightbox = (photo: Photo) => {
    const index = currentPhotos.findIndex((p) => p._id === photo._id);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxOpen(true);
  };

  return (
    <div className="pt-4 pb-12 md:pt-8 md:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Category Tabs */}
      <div className="flex items-center justify-start md:justify-center gap-3 md:gap-6 mb-10 overflow-x-auto whitespace-nowrap scrollbar-none px-4 md:px-0 -mx-4 md:mx-0">
        <button
          onClick={() => setActiveCategory('all')}
          className={`font-body text-xs tracking-[0.2em] uppercase transition-all px-4 py-2 rounded-full border ${
            activeCategory === 'all'
              ? 'bg-[#EAEAEA] text-text-primary border-[#EAEAEA] font-medium'
              : 'bg-transparent text-text-muted border-transparent hover:border-border hover:text-text-primary'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => setActiveCategory(cat._id)}
            className={`font-body text-xs tracking-[0.2em] uppercase transition-all px-4 py-2 rounded-full border ${
              activeCategory === cat._id
                ? 'bg-[#EAEAEA] text-text-primary border-[#EAEAEA] font-medium'
                : 'bg-transparent text-text-muted border-transparent hover:border-border hover:text-text-primary'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Photo Grid with Infinite Scroll */}
      <div className="min-h-[400px]">
        {currentPhotos.length > 0 ? (
          <InfiniteScroll
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoading={isLoading}
          >
            <PhotoGrid photos={currentPhotos} onPhotoClick={openLightbox} />
          </InfiniteScroll>
        ) : (
          !isLoading && (
            <div className="text-center py-20">
              <p className="font-body text-text-muted">No photos found in this category.</p>
            </div>
          )
        )}
        
        {/* Loading State for initial fetch */}
        {isLoading && currentPhotos.length === 0 && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-border border-t-text-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          photos={currentPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
