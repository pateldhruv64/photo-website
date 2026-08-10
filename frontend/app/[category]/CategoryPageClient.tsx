'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import Navbar from '@/components/Navbar';
import PhotoGrid from '@/components/PhotoGrid';
import Lightbox from '@/components/Lightbox';
import InfiniteScroll from '@/components/InfiniteScroll';
import VideoCard from '@/components/VideoCard';
import VideoLightbox from '@/components/VideoLightbox';
import Footer from '@/components/Footer';
import { fetcher } from '@/lib/fetcher';
import type { Photo, Category, PaginatedPhotos, VideoItem, SiteConfig } from '@/lib/types';

interface Props {
  categorySlug: string;
  /** Server se aaya hua data — pehle render me hi HTML me maujood hota hai */
  category: Category;
  initialPhotos: Photo[];
  initialPagination: PaginatedPhotos['pagination'];
  initialVideos: VideoItem[];
  initialConfig: SiteConfig;
  seoDescription: string;
  introText: string;
  photoCount: number;
  brand: string;
  location: string;
}

export default function CategoryPageClient({
  categorySlug,
  category,
  initialPhotos,
  initialPagination,
  initialVideos,
  initialConfig,
  seoDescription,
  introText,
  photoCount,
  brand,
  location,
}: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoLightbox, setVideoLightbox] = useState<VideoItem | null>(null);

  // Config aur videos server se aa chuke hain — SWR sirf background
  // refresh ke liye hai, isliye fallbackData de rahe hain.
  const { data: config } = useSWR<SiteConfig>('/config', fetcher, {
    fallbackData: initialConfig,
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const { data: videos } = useSWR<VideoItem[]>(`/videos?category=${categorySlug}`, fetcher, {
    fallbackData: initialVideos,
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const getKey = (pageIndex: number, previousPageData: PaginatedPhotos | null) => {
    if (previousPageData && !previousPageData.pagination.hasMore) return null;
    return `/photos?category=${categorySlug}&page=${pageIndex + 1}&limit=${initialPagination.limit}`;
  };

  const { data, setSize, isValidating } = useSWRInfinite<PaginatedPhotos>(getKey, fetcher, {
    // Page 1 server par render ho chuka hai — dobara fetch karne ki zarurat nahi
    fallbackData: [{ photos: initialPhotos, pagination: initialPagination }],
    revalidateOnFocus: false,
    revalidateFirstPage: false,
    revalidateOnMount: false,
  });

  const allPhotos = data ? data.flatMap((page) => page.photos) : initialPhotos;
  const hasMore = data
    ? data[data.length - 1]?.pagination?.hasMore ?? false
    : initialPagination.hasMore;

  const loadMore = useCallback(() => {
    setSize((prev) => prev + 1);
  }, [setSize]);

  const openLightbox = (photo: Photo) => {
    const index = allPhotos.findIndex((p) => p._id === photo._id);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxOpen(true);
  };

  const displayCount = photoCount || allPhotos.length;
  const videoList = videos || initialVideos;

  return (
    <main className="min-h-screen bg-background text-ink">
      <Navbar config={initialConfig} />

      {/* ── Category header (server-rendered — Google isko padhta hai) ── */}
      <header className="pt-28 md:pt-36 pb-10 md:pb-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          {/* Breadcrumb — user aur crawler dono ke liye */}
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex items-center gap-2 font-body text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              <li>
                <Link href="/" className="transition-colors hover:text-accent">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-line-strong">
                /
              </li>
              <li className="text-ink-soft" aria-current="page">
                {category.name}
              </li>
            </ol>
          </nav>

          <p className="eyebrow">
            {displayCount > 0 ? `${displayCount} photographs` : 'Portfolio'}
          </p>

          <h1 className="max-w-4xl font-display text-4xl font-light leading-[1.08] tracking-[-0.01em] text-ink sm:text-5xl md:text-6xl lg:text-7xl">
            {category.name}
            <span className="italic text-ink-soft"> Photography</span>
            {location && (
              <span className="block pt-1 font-body text-base font-light not-italic tracking-normal text-ink-muted sm:text-lg">
                in {location} — by {brand}
              </span>
            )}
          </h1>

          {(introText || seoDescription) && (
            <p className="mt-6 max-w-2xl font-body text-[15px] leading-relaxed text-ink-muted">
              {introText || seoDescription}
            </p>
          )}

          <div className="mt-8 h-px w-full bg-gradient-to-r from-line-strong via-line to-transparent" />
        </div>
      </header>

      {/* ── Photo grid ── */}
      <section aria-label={`${category.name} photo gallery`} className="mx-auto max-w-7xl px-5 pb-16 sm:px-6 lg:px-8">
        <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} isLoading={isValidating}>
          <PhotoGrid photos={allPhotos} onPhotoClick={openLightbox} />
        </InfiniteScroll>

        {allPhotos.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-display text-2xl font-light text-ink-soft">
              This collection is being curated
            </p>
            <p className="mt-2 font-body text-sm text-ink-muted">
              New work lands here soon. Meanwhile,{' '}
              <Link href="/" className="text-accent underline-offset-4 hover:underline">
                browse the full portfolio
              </Link>
              .
            </p>
          </div>
        )}

        {/* ── Videos ── */}
        {videoList.length > 0 && (
          <section aria-label={`${category.name} films`} className="mt-16 border-t border-line/70 pt-12">
            <p className="eyebrow">Films</p>
            <h2 className="font-display text-2xl font-light text-ink sm:text-3xl">
              {category.name} cinematography
            </h2>
            <div className="mt-8 grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {videoList.map((video) => (
                <VideoCard key={video._id} video={video} onClick={(v) => setVideoLightbox(v)} />
              ))}
            </div>
          </section>
        )}
      </section>

      <Footer config={config} />

      {lightboxOpen && (
        <Lightbox
          photos={allPhotos}
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
    </main>
  );
}
