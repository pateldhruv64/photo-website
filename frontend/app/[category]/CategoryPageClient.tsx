'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import Navbar from '@/components/Navbar';
import PhotoGrid from '@/components/PhotoGrid';
import Lightbox from '@/components/Lightbox';
import InfiniteScroll from '@/components/InfiniteScroll';
import VideoCard from '@/components/VideoCard';
import VideoLightbox from '@/components/VideoLightbox';
import { fetcher } from '@/lib/fetcher';
import { getPreloadedCategoryPhotos } from '@/lib/preloadedStore';
import Footer from '@/components/Footer';
import type { Photo, Category, PaginatedPhotos, VideoItem, SiteConfig } from '@/lib/types';

interface Props {
  categorySlug: string;
}

export default function CategoryPageClient({ categorySlug }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoLightbox, setVideoLightbox] = useState<VideoItem | null>(null);

  // Fetch site config for footer
  const { data: config } = useSWR<SiteConfig>('/config', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  // Fetch videos for this category
  const { data: videos } = useSWR<VideoItem[]>(categorySlug ? `/videos?category=${categorySlug}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  // Load categories list on the client side. Since SWR caches globally, this resolves instantly.
  const { data: categories } = useSWR<Category[]>('/categories', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const category = categories?.find((c) => c.slug === categorySlug);

  // Attempt to resolve preloaded photos from the home page bulk query to avoid initial loading lag
  const preloadedPhotos = getPreloadedCategoryPhotos(categorySlug);
  const resolvedInitialPhotos = preloadedPhotos || [];
  const resolvedInitialPagination = preloadedPhotos
    ? { page: 1, limit: preloadedPhotos.length, total: preloadedPhotos.length, pages: 1, hasMore: false }
    : null;

  const getKey = (pageIndex: number, previousPageData: PaginatedPhotos | null) => {
    if (!categorySlug) return null;
    if (previousPageData && !previousPageData.pagination.hasMore) return null;
    return `/photos?category=${categorySlug}&page=${pageIndex + 1}&limit=20`;
  };

  const { data, setSize, isValidating } = useSWRInfinite<PaginatedPhotos>(
    getKey,
    fetcher,
    {
      fallbackData: resolvedInitialPagination ? [{ photos: resolvedInitialPhotos, pagination: resolvedInitialPagination }] : undefined,
      revalidateOnFocus: false,
      revalidateFirstPage: false,
    }
  );

  const allPhotos = data ? data.flatMap((page) => page.photos) : resolvedInitialPhotos;
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
    <main className="bg-[#FEFCF8] text-[#1E1410] min-h-screen">
      <Navbar />

      {/* Category Header */}
      <div className="pt-28 md:pt-36 pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-text-primary animate-fade-in">
            {category?.name || 'Loading...'}
          </h1>
          {category?.description && (
            <p className="mt-3 font-body text-sm md:text-base text-text-muted max-w-2xl animate-fade-in-up">
              {category.description}
            </p>
          )}
          <div className="mt-4 font-body text-xs tracking-[0.2em] uppercase text-text-muted animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {allPhotos.length} photos
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

        {/* Videos Section Below Photos */}
        {videos && videos.length > 0 && (
          <div className="mt-16 pt-10 border-t border-border/20 flex flex-col items-center md:items-start">
            <p className="eyebrow justify-center md:justify-start">
              Videos
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 w-full">
              {videos.map((video) => (
                <VideoCard
                  key={video._id}
                  video={video}
                  onClick={(v) => setVideoLightbox(v)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inspira Luxury Footer */}
      <Footer config={config} />

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          photos={allPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}

      {/* Video Lightbox */}
      {videoLightbox && (
        <VideoLightbox
          youtubeId={videoLightbox.youtube_id}
          platform={videoLightbox.platform}
          title={videoLightbox.title}
          onClose={() => setVideoLightbox(null)}
        />
      )}
    </main>
  );
}
