'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
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
  const galleryRef = useRef<HTMLDivElement>(null);

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
    const index = filteredPhotos.findIndex((p) => p._id === photo._id);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxOpen(true);
  };

  const allCategories = [{ _id: 'all', name: 'All Work', slug: 'all' }, ...categories];

  return (
    <div className="pt-4 pb-6 md:pt-8 md:pb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="gallery-section">
      {/* Animate UI Animated Category Pill Tabs */}
      <div className="flex items-center justify-start md:justify-center mb-10 overflow-x-auto whitespace-nowrap no-scrollbar py-2 w-full">
        <div className="flex items-center gap-1.5 p-1.5 bg-[#EAE3D9]/60 backdrop-blur-md rounded-full border border-[#EDE4D8]">
          {allCategories.map((cat) => {
            const isActive = activeCategory === cat._id;
            return (
              <button
                key={cat._id}
                onClick={() => handleCategoryChange(cat._id)}
                className={`relative px-5 py-2 text-xs font-medium tracking-widest uppercase transition-colors duration-300 rounded-full z-10 ${
                  isActive ? 'text-white' : 'text-[#7A6555] hover:text-[#1E1410]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 bg-[#1E1410] rounded-full z-[-1] shadow-md"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Photo Grid with Client-Side Infinite Scroll + Videos */}
      <div className="min-h-[400px]">
        {currentPhotos.length > 0 || activeVideos.length > 0 ? (
          <InfiniteScroll
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoading={false}
          >
            <div ref={galleryRef} className="w-full">
              <PhotoGrid photos={currentPhotos} onPhotoClick={openLightbox} />
            </div>

            {/* Videos Section Below Photos */}
            {activeVideos.length > 0 && (
              <div className="mt-10 pt-10 border-t border-border/20 flex flex-col items-center md:items-start">
                <p className="eyebrow justify-center md:justify-start mb-6">
                  Featured Videos
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
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
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={(i) => setLightboxIndex(i)}
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
    </div>
  );
}
