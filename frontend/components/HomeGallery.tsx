'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import useSWRInfinite from 'swr/infinite';
import PhotoGrid from './PhotoGrid';
import Lightbox from './Lightbox';
import VideoCard from './VideoCard';
import VideoLightbox from './VideoLightbox';
import InfiniteScroll from './InfiniteScroll';
import { fetcher } from '@/lib/fetcher';
import type { Category, Photo, VideoItem, PaginatedPhotos } from '@/lib/types';

interface Props {
  categories: Category[];
  initialPhotos?: Photo[];
  initialVideos?: VideoItem[];
  initialPagination?: { page: number; limit: number; total: number; hasMore: boolean };
}

const PAGE_SIZE = 24;

/**
 * ─────────────────────────────────────────────────────────────────────
 *  HOME GALLERY
 * ─────────────────────────────────────────────────────────────────────
 *  Purana design do wajah se dheere tha:
 *
 *  1. Server pehle hi saari photos bhej chuka hota tha, phir yeh component
 *     mount hote hi `useSWR('/homepage')` se WAHI data dobara maangta tha.
 *     Har visit par payload do baar.
 *
 *  2. Category filtering client par hoti thi — matlab kaam karne ke liye
 *     har photo ka browser me hona zaroori tha. 500 photos par yeh
 *     unusable ho jaata.
 *
 *  Ab: server pehla page deta hai (SWR ka fallback), aur "load more" /
 *  category switch server se sirf utna hi maangte hain jitna chahiye.
 *  SWR har category ka response cache karta hai, to dobara tab par
 *  jaana instant hai.
 */
export default function HomeGallery({
  categories,
  initialPhotos = [],
  initialVideos = [],
  initialPagination,
}: Props) {
  const [activeSlug, setActiveSlug] = useState<string>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoLightbox, setVideoLightbox] = useState<VideoItem | null>(null);

  const getKey = useCallback(
    (pageIndex: number, previous: PaginatedPhotos | null) => {
      if (previous && !previous.pagination.hasMore) return null;
      const base = `/photos?page=${pageIndex + 1}&limit=${PAGE_SIZE}`;
      return activeSlug === 'all' ? base : `${base}&category=${activeSlug}`;
    },
    [activeSlug]
  );

  const { data, size, setSize, isValidating } = useSWRInfinite<PaginatedPhotos>(getKey, fetcher, {
    // "All work" ka pehla page server se aa chuka hai — dobara mat maango
    fallbackData:
      activeSlug === 'all' && initialPhotos.length
        ? [
            {
              photos: initialPhotos,
              pagination: {
                page: 1,
                limit: initialPagination?.limit ?? initialPhotos.length,
                total: initialPagination?.total ?? initialPhotos.length,
                pages: 1,
                hasMore: initialPagination?.hasMore ?? false,
              },
            },
          ]
        : undefined,
    revalidateFirstPage: false,
    revalidateOnFocus: false,
    revalidateOnMount: activeSlug !== 'all',
    persistSize: false,
  });

  const photos = useMemo(() => (data ? data.flatMap((p) => p.photos) : []), [data]);
  const last = data?.[data.length - 1]?.pagination;
  const hasMore = last?.hasMore ?? false;
  const total = last?.total ?? initialPagination?.total ?? photos.length;

  // Category switch par page count reset — warna nayi category page 3 se shuru hoti
  const selectCategory = useCallback(
    (slug: string) => {
      setActiveSlug(slug);
      setSize(1);
    },
    [setSize]
  );

  // Navbar / URL se category select karne ka support
  useEffect(() => {
    const onEvent = (e: Event) => {
      const slug = (e as CustomEvent).detail;
      if (typeof slug === 'string') selectCategory(slug);
    };
    window.addEventListener('categoryChange', onEvent);

    const slug = new URLSearchParams(window.location.search).get('cat');
    if (slug && categories.some((c) => c.slug === slug)) {
      selectCategory(slug);
      document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' });
    }

    return () => window.removeEventListener('categoryChange', onEvent);
  }, [categories, selectCategory]);

  const videos = useMemo(() => {
    const active = initialVideos.filter((v) => v.is_active);
    if (activeSlug === 'all') return active;
    return active.filter((v) =>
      typeof v.category === 'object' ? v.category?.slug === activeSlug : false
    );
  }, [activeSlug, initialVideos]);

  const openLightbox = (photo: Photo) => {
    const i = photos.findIndex((p) => p._id === photo._id);
    setLightboxIndex(i >= 0 ? i : 0);
    setLightboxOpen(true);
  };

  const tabs = [
    { slug: 'all', name: 'All Work', count: initialPagination?.total ?? photos.length },
    ...categories.map((c) => ({ slug: c.slug, name: c.name, count: c.photoCount ?? 0 })),
  ];

  const loading = isValidating && photos.length === 0;

  return (
    <section
      className="mx-auto max-w-7xl px-5 pb-8 pt-10 sm:px-6 md:pb-12 md:pt-16 lg:px-8"
      id="gallery-section"
      aria-labelledby="gallery-heading"
    >
      {/* ── Section header ── */}
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
          {total > 0
            ? `${total} frames across ${categories.length} collections. Tap any photo to view full screen.`
            : 'Browse the collections below.'}
        </p>
      </div>

      {/* ── Category tabs (Apple HIG Segmented Control) ── */}
      <div className="no-scrollbar -mx-5 mb-9 flex items-center overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0 md:mb-11 md:justify-center">
        <div
          role="tablist"
          aria-label="Filter photos by collection"
          className="inline-flex items-center gap-1 rounded-full border border-line/80 bg-canvas/80 p-1.5 shadow-[inset_0_1px_2px_rgba(20,36,51,0.05),0_2px_12px_rgba(20,36,51,0.04)] backdrop-blur-xl"
        >
          {tabs.map((tab) => {
            const isActive = activeSlug === tab.slug;
            return (
              <button
                key={tab.slug}
                role="tab"
                aria-selected={isActive}
                onClick={() => selectCategory(tab.slug)}
                className={`relative flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 font-body text-[11px] uppercase tracking-[0.16em] transition-all duration-300 ease-editorial active:scale-[0.96] ${
                  isActive
                    ? 'bg-ink text-canvas shadow-[0_2px_10px_rgba(20,36,51,0.22),inset_0_1px_0_rgba(255,255,255,0.18)] font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-black/[0.04]'
                }`}
              >
                <span>{tab.name}</span>
                {tab.count > 0 && (
                  <span
                    className={`tabular rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                      isActive ? 'bg-white/20 text-canvas' : 'bg-line/70 text-ink-muted'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="masonry-grid">
            {/* Skeleton — spinner se behtar, kyunki layout shift nahi hota */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="masonry-grid-column">
                <div
                  className="shimmer mb-3 rounded-xl md:mb-5 md:rounded-2xl"
                  style={{ height: 180 + ((i * 47) % 140) }}
                />
              </div>
            ))}
          </div>
        ) : photos.length > 0 || videos.length > 0 ? (
          <InfiniteScroll
            onLoadMore={() => setSize(size + 1)}
            hasMore={hasMore}
            isLoading={isValidating}
          >
            <PhotoGrid photos={photos} onPhotoClick={openLightbox} />

            {videos.length > 0 && (
              <div className="mt-14 border-t border-line/70 pt-12">
                <p className="eyebrow">Motion</p>
                <h3 className="mb-8 font-display text-2xl font-light text-ink sm:text-3xl">
                  Films &amp; <span className="italic text-ink-soft">reels</span>
                </h3>
                <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {videos.map((video) => (
                    <VideoCard key={video._id} video={video} onClick={setVideoLightbox} />
                  ))}
                </div>
              </div>
            )}
          </InfiniteScroll>
        ) : (
          <div className="py-24 text-center">
            <p className="font-display text-2xl font-light text-ink-soft">Nothing here yet</p>
            <p className="mt-2 font-body text-sm text-ink-muted">
              This collection is still being curated. Try another one above.
            </p>
          </div>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}

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
