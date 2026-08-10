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
    <section
      className="mx-auto max-w-7xl px-5 pb-8 pt-10 sm:px-6 md:pb-12 md:pt-16 lg:px-8"
      id="gallery-section"
      aria-labelledby="gallery-heading"
    >
      {/* ── Section header ──
          Pehle yaha seedhe tabs shuru ho jaate the — na koi heading, na
          rhythm. H2 se page ka structure Google ko bhi saaf dikhta hai. */}
      <div className="mb-8 flex flex-col items-start gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">The Portfolio</p>
          <h2
            id="gallery-heading"
            className="font-display text-3xl font-light leading-[1.1] tracking-[-0.01em] text-ink sm:text-4xl md:text-5xl"
          >
            Selected <span className="italic text-ink-soft">work</span>
          </h2>
        </div>

        <p className="max-w-sm font-body text-[13px] leading-relaxed text-ink-muted md:text-right">
          {latestPhotos.length > 0
            ? `${latestPhotos.length} frames across ${categories.length} collections. Tap any photo to view full screen.`
            : 'Browse the collections below.'}
        </p>
      </div>

      {/* ── Category tabs ──
          Mobile par scroll hoti hain, edges par fade taki pata chale
          aur bhi options hain. */}
      <div
        role="tablist"
        aria-label="Filter photos by collection"
        className="no-scrollbar -mx-5 mb-9 flex items-center gap-1.5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0 md:mb-11 md:justify-center"
      >
        {allCategories.map((cat) => {
          const isActive = activeCategory === cat._id;
          const count =
            cat._id === 'all'
              ? latestPhotos.length
              : latestPhotos.filter((p) => {
                  if (!p.category) return false;
                  if (typeof p.category === 'string') return p.category === cat._id;
                  return p.category._id === cat._id;
                }).length;

          return (
            <button
              key={cat._id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleCategoryChange(cat._id)}
              className={`relative z-10 flex flex-shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 font-body text-[11px] uppercase tracking-[0.16em] transition-colors duration-300 ${
                isActive
                  ? 'border-transparent text-canvas'
                  : 'border-line bg-canvas/70 text-ink-muted hover:border-line-strong hover:text-ink'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 z-[-1] rounded-full bg-ink"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span>{cat.name}</span>
              {count > 0 && (
                <span
                  className={`tabular text-[10px] font-medium ${
                    isActive ? 'text-canvas/55' : 'text-ink-muted'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
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
              <div className="mt-14 border-t border-line/70 pt-12">
                <p className="eyebrow">Motion</p>
                <h3 className="mb-8 font-display text-2xl font-light text-ink sm:text-3xl">
                  Films &amp; <span className="italic text-ink-soft">reels</span>
                </h3>
                <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="py-24 text-center">
            <p className="font-display text-2xl font-light text-ink-soft">
              Nothing here yet
            </p>
            <p className="mt-2 font-body text-sm text-ink-muted">
              This collection is still being curated. Try another one above.
            </p>
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
    </section>
  );
}
