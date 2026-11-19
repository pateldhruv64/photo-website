'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  initialPagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const DEFAULT_PAGE_SIZE = 24;
const FILMS_SLUG = 'films';
const PRELOAD_THRESHOLD = 3; // lightbox me last 3 photos pe agla page load

/**
 * HOME GALLERY
 * Server pehla page deta hai (SWR fallback). "Load more" aur category switch
 * server se sirf utna maangte hain jitna chahiye. SWR har category cache karta hai.
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

  const tablistRef = useRef<HTMLDivElement>(null);
  const urlHandledRef = useRef(false);
  const firstTabRenderRef = useRef(true);

  const hasInitial = initialPhotos.length > 0;

  // Server ne jo page size use kiya, wahi aage bhi use karo.
  // Warna (jaise server 12, client 24) page 2 pe beech ki photos skip ho jaati hain.
  const pageSize =
    initialPagination?.limit ?? (initialPhotos.length || DEFAULT_PAGE_SIZE);

  const getKey = useCallback(
    (pageIndex: number, previous: PaginatedPhotos | null) => {
      if (activeSlug === FILMS_SLUG) return null; // Films tab me photos nahi chahiye
      if (previous && !previous.pagination.hasMore) return null;
      const base = `/photos?page=${pageIndex + 1}&limit=${pageSize}`;
      return activeSlug === 'all' ? base : `${base}&category=${activeSlug}`;
    },
    [activeSlug, pageSize],
  );

  // "All work" ka pehla page server se aa chuka hai — dobara mat maango
  const fallbackData = useMemo<PaginatedPhotos[] | undefined>(() => {
    if (activeSlug !== 'all' || !hasInitial) return undefined;
    const total = initialPagination?.total ?? initialPhotos.length;
    return [
      {
        photos: initialPhotos,
        pagination: {
          page: 1,
          limit: pageSize,
          total,
          pages: Math.max(1, Math.ceil(total / pageSize)),
          hasMore: initialPagination?.hasMore ?? false,
        },
      },
    ];
  }, [activeSlug, hasInitial, initialPhotos, initialPagination, pageSize]);

  const { data, error, size, setSize, isLoading, mutate } =
    useSWRInfinite<PaginatedPhotos>(getKey, fetcher, {
      fallbackData,
      revalidateFirstPage: false,
      revalidateOnFocus: false,
      // Server data nahi aaya (empty) to mount pe fetch zaroori hai, warna gallery khali rahegi
      revalidateOnMount: !hasInitial,
      persistSize: false, // category badalne pe size khud 1 pe reset
    });

  // Dedupe by _id: naya upload beech me aaye to page boundary pe duplicate aa sakta hai
  const photos = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const out: Photo[] = [];
    for (const page of data) {
      for (const p of page?.photos ?? []) {
        if (!seen.has(p._id)) {
          seen.add(p._id);
          out.push(p);
        }
      }
    }
    return out;
  }, [data]);

  const lastPage = data?.[data.length - 1];
  const hasMore = lastPage?.pagination.hasMore ?? false;

  // Load-more ka sahi loading state (background revalidate isse block nahi karta)
  const isLoadingMore =
    isLoading || (size > 0 && !!data && typeof data[size - 1] === 'undefined');

  // "All work" ka total — category filter me bhi header galat na ho
  const allTotal =
    initialPagination?.total ??
    (categories.reduce((sum, c) => sum + (c.photoCount ?? 0), 0) ||
      photos.length);

  const selectCategory = useCallback((slug: string) => {
    setActiveSlug(slug);
  }, []);

  // Navbar se category change event
  useEffect(() => {
    const onEvent = (e: Event) => {
      const slug = (e as CustomEvent).detail;
      if (typeof slug === 'string') selectCategory(slug);
    };
    window.addEventListener('categoryChange', onEvent);
    return () => window.removeEventListener('categoryChange', onEvent);
  }, [selectCategory]);

  // URL ?cat= — sirf EK baar. Pehle har baar chalta tha jab `categories` ki identity badalti,
  // aur user ki chuni hui category ko reset kar deta tha.
  useEffect(() => {
    if (urlHandledRef.current) return;
    urlHandledRef.current = true;

    const slug = new URLSearchParams(window.location.search).get('cat');
    if (slug && categories.some((c) => c.slug === slug)) {
      selectCategory(slug);
      document
        .getElementById('gallery-section')
        ?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [categories, selectCategory]);

  // Mobile pe active tab center me scroll ho (pehli render pe nahi, warna page jump karega)
  useEffect(() => {
    if (firstTabRenderRef.current) {
      firstTabRenderRef.current = false;
      return;
    }
    tablistRef.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
  }, [activeSlug]);

  const allVideos = useMemo(
    () => initialVideos.filter((v) => v.is_active),
    [initialVideos],
  );
  const isFilmsTab = activeSlug === FILMS_SLUG;

  const videos = useMemo(() => {
    if (activeSlug === 'all' || activeSlug === FILMS_SLUG) return allVideos;
    return allVideos.filter((v) => {
      const c = v.category;
      if (!c) return false;
      if (typeof c === 'object') return c.slug === activeSlug;
      return c === activeSlug; // category slug string ke roop me aaye to
    });
  }, [activeSlug, allVideos]);

  const openLightbox = (photo: Photo) => {
    const i = photos.findIndex((p) => p._id === photo._id);
    setLightboxIndex(i >= 0 ? i : 0);
    setLightboxOpen(true);
  };

  // Lightbox me end ke paas pahunche to agla page pehle se load kar lo
  const handleLightboxNavigate = useCallback(
    (i: number) => {
      setLightboxIndex(i);
      if (hasMore && !isLoadingMore && i >= photos.length - PRELOAD_THRESHOLD) {
        setSize((s) => s + 1);
      }
    },
    [hasMore, isLoadingMore, photos.length, setSize],
  );

  const tabs = [
    { slug: 'all', name: 'All Work', count: allTotal },
    ...categories.map((c) => ({
      slug: c.slug,
      name: c.name,
      count: c.photoCount ?? 0,
    })),
    // Videos infinite list ke neeche dab jaate hain, isliye unka apna tab
    ...(allVideos.length > 0
      ? [{ slug: FILMS_SLUG, name: 'Films', count: allVideos.length }]
      : []),
  ];

  // Tabs ke liye arrow-key navigation (WAI-ARIA tabs pattern)
  const onTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.slug === activeSlug);
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(i + step + tabs.length) % tabs.length];
    selectCategory(next.slug);
    tablistRef.current
      ?.querySelector<HTMLElement>(`[data-slug="${next.slug}"]`)
      ?.focus();
  };

  const showSkeleton = isLoading && photos.length === 0;
  const showError = !!error && photos.length === 0;
  const hasContent = photos.length > 0 || videos.length > 0;

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
          {allTotal > 0
            ? `${allTotal} frames across ${categories.length} collections. Tap any photo to view full screen.`
            : 'Browse the collections below.'}
        </p>
      </div>

      {/* ── Category tabs ── */}
      <div className="no-scrollbar -mx-5 mb-9 flex items-center overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0 md:mb-11 md:justify-center">
        <div
          ref={tablistRef}
          role="tablist"
          aria-label="Filter photos by collection"
          onKeyDown={onTabKeyDown}
          className="inline-flex items-center gap-1 rounded-full border border-line/80 bg-canvas/80 p-1.5 shadow-[inset_0_1px_2px_rgba(20,36,51,0.05),0_2px_12px_rgba(20,36,51,0.04)] backdrop-blur-xl"
        >
          {tabs.map((tab) => {
            const isActive = activeSlug === tab.slug;
            return (
              <button
                key={tab.slug}
                id={`gallery-tab-${tab.slug}`}
                data-slug={tab.slug}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="gallery-panel"
                tabIndex={isActive ? 0 : -1}
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
                      isActive
                        ? 'bg-white/20 text-canvas'
                        : 'bg-line/70 text-ink-muted'
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

      {/* ── Panel ── */}
      <div
        id="gallery-panel"
        role="tabpanel"
        aria-labelledby={`gallery-tab-${activeSlug}`}
        aria-busy={isLoading}
        className="min-h-[400px]"
      >
        {showSkeleton ? (
          <div className="masonry-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="masonry-grid-column">
                <div
                  className="shimmer mb-3 rounded-xl md:mb-5 md:rounded-2xl"
                  style={{ height: 180 + ((i * 47) % 140) }}
                />
              </div>
            ))}
          </div>
        ) : showError ? (
          <div className="py-24 text-center" role="alert">
            <p className="font-display text-2xl font-light text-ink-soft">
              Couldn&rsquo;t load photos
            </p>
            <p className="mt-2 font-body text-sm text-ink-muted">
              Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => mutate()}
              className="mt-6 rounded-full bg-ink px-5 py-2 font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-canvas transition-transform active:scale-[0.96]"
            >
              Retry
            </button>
          </div>
        ) : hasContent ? (
          <>
            {/* Photos pehle */}
            {!isFilmsTab && photos.length > 0 && (
              <InfiniteScroll
                onLoadMore={() => setSize((s) => s + 1)}
                hasMore={hasMore}
                isLoading={isLoadingMore}
              >
                <PhotoGrid photos={photos} onPhotoClick={openLightbox} />
              </InfiniteScroll>
            )}

            {/* Load-more fail hua to user ko batao, silently atko mat */}
            {error && photos.length > 0 && (
              <div className="mt-8 text-center" role="alert">
                <p className="font-body text-sm text-ink-muted">
                  Couldn&rsquo;t load more photos.
                </p>
                <button
                  type="button"
                  onClick={() => mutate()}
                  className="mt-3 font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-ink underline underline-offset-4"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Videos photos ke NEECHE. Jab tak aur photos load hone baaki hain tab tak
                nahi dikhte (warna scroll karte hue beech me aa jaate). Turant dekhne ke liye "Films" tab hai. */}
            {videos.length > 0 && (isFilmsTab || !hasMore) && (
              <div
                className={
                  isFilmsTab ? '' : 'mt-14 border-t border-line/70 pt-12'
                }
              >
                <p className="eyebrow">Motion</p>
                <h3 className="mb-8 font-display text-2xl font-light text-ink sm:text-3xl">
                  Films &amp;{' '}
                  <span className="italic text-ink-soft">reels</span>
                </h3>
                <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {videos.map((video) => (
                    <VideoCard
                      key={video._id}
                      video={video}
                      onClick={setVideoLightbox}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
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

      {lightboxOpen && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={handleLightboxNavigate}
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
