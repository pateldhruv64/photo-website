'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import PhotoGrid from './PhotoGrid';
import Lightbox from './Lightbox';
import VideoCard from './VideoCard';
import VideoLightbox from './VideoLightbox';
import InfiniteScroll from './InfiniteScroll';
import { fetcher } from '@/lib/fetcher';
import { setPreloadedCategoryPhotos } from '@/lib/preloadedStore';
import type { Category, Photo, VideoItem } from '@/lib/types';

interface Props {
  categories: Category[];
  initialPhotos?: Photo[];
  initialVideos?: VideoItem[];
}

interface HomepageBulkData {
  photos: Photo[];
  videos: VideoItem[];
}

export default function HomeGallery({ categories, initialPhotos = [], initialVideos = [] }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoLightbox, setVideoLightbox] = useState<VideoItem | null>(null);

  // Background fetch latest photos & videos to bypass Next.js build cache
  const { data: bulkData } = useSWR<HomepageBulkData>('/homepage', fetcher, {
    fallbackData: { photos: initialPhotos, videos: initialVideos },
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const latestPhotos = bulkData?.photos || initialPhotos;
  const latestVideos = bulkData?.videos || initialVideos;

  useEffect(() => {
    if (!latestPhotos || latestPhotos.length === 0) return;
    
    categories.forEach((cat) => {
      const catPhotos = latestPhotos.filter((p) => {
        if (!p.category) return false;
        if (typeof p.category === 'string') return p.category === cat._id;
        return p.category._id === cat._id;
      });
      setPreloadedCategoryPhotos(cat.slug, catPhotos);
    });
  }, [latestPhotos, categories]);

  // In-memory pagination visible limit
  const [visibleLimit, setVisibleLimit] = useState(20);

  // Reset pagination limit when category changes to start fresh
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setVisibleLimit(20);
  };

  // Sync category state from Navbar clicks & URL query params
  useEffect(() => {
    const handleCategoryEvent = (e: Event) => {
      const catId = (e as CustomEvent).detail;
      setActiveCategory(catId);
      setVisibleLimit(20);
    };
    window.addEventListener('categoryChange', handleCategoryEvent);

    // Read query parameter on mount/load
    const params = new URLSearchParams(window.location.search);
    const catSlug = params.get('cat');
    if (catSlug) {
      const matchedCat = categories.find(c => c.slug === catSlug);
      if (matchedCat) {
        setActiveCategory(matchedCat._id);
        setTimeout(() => {
          document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }

    return () => {
      window.removeEventListener('categoryChange', handleCategoryEvent);
    };
  }, [categories]);

  // Filter photos in memory based on category selection
  const filteredPhotos = useMemo(() => {
    if (activeCategory === 'all') return latestPhotos;
    return latestPhotos.filter((p) => {
      if (!p.category) return false;
      if (typeof p.category === 'string') return p.category === activeCategory;
      return p.category._id === activeCategory;
    });
  }, [activeCategory, latestPhotos]);

  // Filter active videos in memory based on category selection
  const activeVideos = useMemo(() => {
    const activeOnly = latestVideos.filter((v) => v.is_active);
    if (activeCategory === 'all') return activeOnly;
    return activeOnly.filter((v) => {
      if (!v.category) return false;
      if (typeof v.category === 'string') return v.category === activeCategory;
      return v.category._id === activeCategory;
    });
  }, [activeCategory, latestVideos]);

  // Paginated chunk of photos to display
  const currentPhotos = useMemo(() => {
    return filteredPhotos.slice(0, visibleLimit);
  }, [filteredPhotos, visibleLimit]);

  const hasMore = visibleLimit < filteredPhotos.length;

  const loadMore = useCallback(() => {
    setVisibleLimit((prev) => prev + 20);
  }, []);

  const openLightbox = (photo: Photo) => {
    const index = currentPhotos.findIndex((p) => p._id === photo._id);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxOpen(true);
  };

  return (
    <div className="pt-4 pb-6 md:pt-8 md:pb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="gallery-section">
      {/* Category Tabs */}
      <div className="flex items-center justify-start md:justify-center gap-3 md:gap-6 mb-10 overflow-x-auto whitespace-nowrap scrollbar-none px-4 md:px-0 -mx-4 md:mx-0">
        <button
          onClick={() => handleCategoryChange('all')}
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
            onClick={() => handleCategoryChange(cat._id)}
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

      {/* Photo Grid with Client-Side Infinite Scroll + Videos */}
      <div className="min-h-[400px]">
        {currentPhotos.length > 0 || activeVideos.length > 0 ? (
          <InfiniteScroll
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoading={false}
          >
            <PhotoGrid photos={currentPhotos} onPhotoClick={openLightbox} />

            {/* Videos Section Below Photos */}
            {activeVideos.length > 0 && (
              <div className="mt-10 pt-10 border-t border-border/20">
                <p className="font-body text-xs tracking-[0.2em] uppercase text-text-muted mb-6">
                  Videos
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeVideos.map((video) => (
                    <VideoCard
                      key={video._id}
                      video={video}
                      onClick={(v) => setVideoLightbox(v)}
                    />
                  ))}
                </div>
              </div>
            )}
          </InfiniteScroll>
        ) : (
          <div className="text-center py-20">
            <p className="font-body text-text-muted text-sm">No photos found in this category.</p>
          </div>
        )}
      </div>

      {/* Photo Lightbox */}
      {lightboxOpen && (
        <Lightbox
          photos={currentPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}

      {/* Video Lightbox */}
      {videoLightbox && (
        <VideoLightbox
          youtubeId={videoLightbox.youtube_id}
          title={videoLightbox.title}
          onClose={() => setVideoLightbox(null)}
        />
      )}
    </div>
  );
}
