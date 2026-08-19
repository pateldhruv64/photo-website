'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Masonry from 'react-masonry-css';
import Footer from '@/components/Footer';
import ClientLightbox, { type LightboxPhoto } from '@/components/ClientLightbox';
import GalleryUnlock from '@/components/client/GalleryUnlock';
import DownloadMenu from '@/components/client/DownloadMenu';
import DownloadDock from '@/components/client/DownloadDock';
import PhotoTile from '@/components/client/PhotoTile';
import { CameraIcon, CheckIcon, HeartIcon, SelectIcon } from '@/components/client/icons';
import { useSiteConfig } from '@/lib/hooks';
import { useGalleryDownload } from '@/lib/useGalleryDownload';
import {
  buildGalleryName,
  buildPhotoFileName,
  downloadSinglePhoto,
  probeCdn,
  type DownloadMode,
} from '@/lib/galleryDownload';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface GalleryPhoto {
  public_id: string;
  width: number;
  height: number;
  title: string;
  order: number;
  original_format: string;
  _id: string;
}

interface GalleryData {
  _id: string;
  title: string;
  client_name: string;
  event_date?: string | null;
  photos: GalleryPhoto[];
}

type Filter = 'all' | 'favourites';

const breakpointColumns = { default: 4, 1280: 4, 1024: 3, 640: 2 };

const favouritesKey = (slug: string) => `gallery_favourites_${slug}`;

export default function ClientGalleryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // ─── Auth ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<'loading' | 'unlock' | 'gallery'>('loading');
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [gallery, setGallery] = useState<GalleryData | null>(null);
  const [token, setToken] = useState('');

  // ─── Gallery UI ───────────────────────────────────────────────────
  const [filter, setFilter] = useState<Filter>('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [singleDownloadId, setSingleDownloadId] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);

  const heroSentinel = useRef<HTMLDivElement>(null);
  const config = useSiteConfig();

  // ─── Session ──────────────────────────────────────────────────────
  const fetchGallery = useCallback(
    async (authToken: string) => {
      try {
        const res = await fetch(`${API_URL}/client-gallery/${slug}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) {
          sessionStorage.removeItem(`gallery_token_${slug}`);
          setStep('unlock');
          return;
        }
        setGallery(await res.json());
        setToken(authToken);
        setStep('gallery');
      } catch {
        sessionStorage.removeItem(`gallery_token_${slug}`);
        setStep('unlock');
      }
    },
    [slug]
  );

  useEffect(() => {
    const saved = sessionStorage.getItem(`gallery_token_${slug}`);
    if (saved) fetchGallery(saved);
    else setStep('unlock');
  }, [slug, fetchGallery]);

  // Favourites client ke device par rehti hain — inke liye account ya
  // backend ki zaroorat nahi, aur gallery expire hone ke baad bhi client
  // ki pasand uske paas rehti hai.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(favouritesKey(slug));
      if (raw) setFavourites(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* storage band hai — favourites bas is session ke liye chalenge */
    }
  }, [slug]);

  const persistFavourites = useCallback(
    (next: Set<string>) => {
      try {
        localStorage.setItem(favouritesKey(slug), JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
    },
    [slug]
  );

  const handleSessionExpired = useCallback(() => {
    sessionStorage.removeItem(`gallery_token_${slug}`);
    setToken('');
    setGallery(null);
    setSelectMode(false);
    setSelected(new Set());
    setStep('unlock');
    setError('Your session expired. Please enter the password again.');
  }, [slug]);

  const handleUnlock = useCallback(
    async (password: string) => {
      setUnlocking(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/client-gallery/unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'That password did not work.');
          return;
        }
        sessionStorage.setItem(`gallery_token_${slug}`, data.token);
        await fetchGallery(data.token);
      } catch {
        setError('Could not reach the server. Check your connection and try again.');
      } finally {
        setUnlocking(false);
      }
    },
    [slug, fetchGallery]
  );

  // ─── Derived data ─────────────────────────────────────────────────

  /**
   * Gallery ka canonical order. Filename ka number isi index se banta
   * hai, aur backend bhi bilkul yahi order use karta hai — isliye zip me
   * aur folder me client ko same naam milte hain.
   */
  const orderedPhotos = useMemo(() => {
    const photos = [...(gallery?.photos ?? [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    return photos.map((photo, index) => ({
      ...photo,
      position: index + 1,
      fileName: buildPhotoFileName(photo, index, photos.length),
    }));
  }, [gallery]);

  const visiblePhotos = useMemo(
    () =>
      filter === 'favourites'
        ? orderedPhotos.filter((p) => favourites.has(p.public_id))
        : orderedPhotos,
    [orderedPhotos, filter, favourites]
  );

  const galleryName = useMemo(
    () => buildGalleryName(gallery?.title || 'gallery'),
    [gallery?.title]
  );

  /**
   * Lightbox apne generic `Photo` type me photos maangta hai. `fileName`
   * aur `position` saath bhejte hain kyunki favourites filter ke baad
   * lightbox ka index gallery ke asli number se alag ho jaata hai — aur
   * download hone wali file ka naam gallery wale number se hi banna
   * chahiye.
   */
  const lightboxPhotos = useMemo<LightboxPhoto[]>(
    () =>
      visiblePhotos.map((p) => ({
        _id: p._id,
        public_id: p.public_id,
        width: p.width,
        height: p.height,
        title: p.title,
        aspect_ratio: p.width / p.height,
        is_featured: false,
        order: p.order,
        original_format: p.original_format || 'jpg',
        category: null as unknown as import('@/lib/types').Category,
        created_at: '',
        fileName: p.fileName,
        position: p.position,
      })),
    [visiblePhotos]
  );

  // ─── Downloads ────────────────────────────────────────────────────
  const { state: downloadState, busy, start, cancel, dismiss } = useGalleryDownload({
    slug,
    token,
    galleryName,
    onSessionExpired: handleSessionExpired,
  });

  const startDownload = useCallback(
    (mode: DownloadMode, scope: 'all' | 'selected' | 'favourites') => {
      const source =
        scope === 'selected'
          ? orderedPhotos.filter((p) => selected.has(p.public_id))
          : scope === 'favourites'
            ? orderedPhotos.filter((p) => favourites.has(p.public_id))
            : orderedPhotos;

      if (!source.length) return;

      start(
        mode,
        source.map((p) => ({ publicId: p.public_id, name: p.fileName })),
        scope !== 'all' || source.length !== orderedPhotos.length
      );
    },
    [orderedPhotos, selected, favourites, start]
  );

  const handleSingleDownload = useCallback(
    async (publicId: string, fileName: string, photoId: string) => {
      if (singleDownloadId) return;
      setSingleDownloadId(photoId);
      try {
        await downloadSinglePhoto(slug, publicId, token, fileName);
      } catch (err) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') handleSessionExpired();
      } finally {
        // CDN link click hone ke baad browser khud sambhal leta hai —
        // spinner ko yahan lamba rakhna jhoot hoga.
        setTimeout(() => setSingleDownloadId(null), 600);
      }
    },
    [slug, token, singleDownloadId, handleSessionExpired]
  );

  // ─── Selection ────────────────────────────────────────────────────
  const toggleSelected = useCallback((publicId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });
  }, []);

  const toggleFavourite = useCallback(
    (publicId: string) => {
      setFavourites((prev) => {
        const next = new Set(prev);
        if (next.has(publicId)) next.delete(publicId);
        else next.add(publicId);
        persistFavourites(next);
        return next;
      });
    },
    [persistFavourites]
  );

  const selectAllVisible = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      visiblePhotos.forEach((p) => next.add(p.public_id));
      return next;
    });
  }, [visiblePhotos]);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, []);

  // Escape se select mode band — chhota sa detail, par jo client 60
  // photos chun chuka hai uske liye ek galat click bahut mehenga hai,
  // isliye Escape sirf mode band karta hai, selection nahi mitata.
  useEffect(() => {
    if (!selectMode || lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectMode, lightboxOpen]);

  // Hero se neeche jaate hi compact sticky bar dikhne lagta hai.
  useEffect(() => {
    const node = heroSentinel.current;
    if (!node) return;
    // Sirf `isIntersecting` dekhna galat hai — page ke top par sentinel
    // viewport ke NEECHE hota hai, wahan bhi intersecting false aata hai.
    // Compact bar tabhi chahiye jab sentinel upar nikal chuka ho.
    const observer = new IntersectionObserver(
      ([entry]) =>
        setCompact(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: '-8px 0px 0px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [step]);

  // CDN reachable hai ya nahi — yeh pehle se pata kar lete hain. Warna
  // client ke pehle download click par ek await lagta hai, aur browser
  // user-gesture se kata hua download kabhi-kabhi rok deta hai.
  useEffect(() => {
    if (orderedPhotos.length) void probeCdn(orderedPhotos[0].public_id);
  }, [orderedPhotos]);

  // Favourites khatam ho jaayein to filter apne aap wapas "all" par.
  useEffect(() => {
    if (filter === 'favourites' && favourites.size === 0) setFilter('all');
  }, [filter, favourites.size]);

  // ─── Render ───────────────────────────────────────────────────────

  if (step === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-accent/30 border-t-accent-deep" />
      </div>
    );
  }

  if (step === 'unlock') {
    return (
      <GalleryUnlock
        config={config}
        error={error}
        loading={unlocking}
        onSubmit={handleUnlock}
      />
    );
  }

  const eventDate = gallery?.event_date
    ? new Date(gallery.event_date).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const selectedCount = selected.size;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky bar — hero ke baad hi dikhta hai ───────────────── */}
      <header
        className={`sticky top-0 z-[100] border-b transition-all duration-500 ease-editorial ${
          compact
            ? 'border-line bg-white/85 backdrop-blur-xl'
            : 'border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div
            className={`flex min-w-0 items-center gap-3 transition-all duration-500 ease-editorial ${
              compact ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-white">
              {config?.studio_logo?.secure_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.studio_logo.secure_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <CameraIcon size={16} className="text-ink-muted" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-base leading-tight text-ink">
                {gallery?.title}
              </p>
              <p className="font-body text-[11px] text-ink-muted">
                {orderedPhotos.length} photos
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 transition-opacity duration-500 ${
              compact ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <button
              onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
              className={`hidden items-center gap-2 rounded-full border px-4 py-2 font-body text-sm transition-all duration-300 sm:inline-flex ${
                selectMode
                  ? 'border-accent-deep bg-accent-deep text-white'
                  : 'border-line-strong bg-white text-ink hover:border-accent'
              }`}
            >
              <SelectIcon size={14} />
              {selectMode ? 'Done' : 'Select'}
            </button>
            <DownloadMenu
              label="Download"

              disabled={busy}
              onPick={(mode) => startDownload(mode, 'all')}
            />
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative -mt-16 overflow-hidden border-b border-line bg-gradient-to-b from-white to-background px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          {gallery?.client_name && (
            <p className="animate-fade-in font-body text-[11px] uppercase tracking-[0.3em] text-accent-deep">
              {gallery.client_name}
            </p>
          )}

          <h1 className="mt-3 font-display text-display-sm font-light text-ink">
            {gallery?.title || 'Your Photos'}
          </h1>

          <p className="mt-3 font-body text-sm text-ink-muted">
            {orderedPhotos.length} photographs
            {eventDate && <span className="text-ink-faint"> · {eventDate}</span>}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <DownloadMenu
              label="Download everything"

              disabled={busy}
              align="left"
              onPick={(mode) => startDownload(mode, 'all')}
            />
            <button
              onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 font-body text-sm font-medium transition-all duration-300 ease-editorial ${
                selectMode
                  ? 'border-accent-deep bg-accent-deep text-white'
                  : 'border-line-strong bg-white text-ink hover:border-accent hover:bg-hover-surface'
              }`}
            >
              <SelectIcon size={15} />
              {selectMode ? 'Done selecting' : 'Pick a few'}
            </button>
          </div>

          <p className="mx-auto mt-5 max-w-md font-body text-xs leading-relaxed text-ink-faint">
            Every photo here is the full-resolution original — exactly what came
            out of the camera. Tap the heart to shortlist your favourites.
          </p>
        </div>
      </section>

      <div ref={heroSentinel} aria-hidden />

      {/* ── Filter row ────────────────────────────────────────────── */}
      {(favourites.size > 0 || selectMode) && (
        <div className="sticky top-16 z-[90] border-b border-line bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
            {favourites.size > 0 && (
              <>
                <button
                  onClick={() => setFilter('all')}
                  className={`cg-chip border px-3.5 py-1.5 font-body text-xs font-medium ${
                    filter === 'all'
                      ? 'border-ink bg-ink text-white'
                      : 'border-line-strong bg-white text-ink-soft hover:border-accent'
                  }`}
                >
                  All {orderedPhotos.length}
                </button>
                <button
                  onClick={() => setFilter('favourites')}
                  className={`cg-chip border px-3.5 py-1.5 font-body text-xs font-medium ${
                    filter === 'favourites'
                      ? 'border-ink bg-ink text-white'
                      : 'border-line-strong bg-white text-ink-soft hover:border-accent'
                  }`}
                >
                  <HeartIcon size={12} filled={filter === 'favourites'} />
                  Favourites {favourites.size}
                </button>

                <button
                  onClick={() => startDownload('zip', 'favourites')}
                  disabled={busy}
                  className="cg-chip px-3 py-1.5 font-body text-xs font-medium text-accent-deep underline underline-offset-2 disabled:opacity-40"
                >
                  Download favourites
                </button>
              </>
            )}

            {selectMode && (
              <>
                {/* Bina is hint ke yeh patti khaali dikhti thi aur client
                    ko pata hi nahi chalta tha ki ab karna kya hai. */}
                <p className="font-body text-xs text-ink-muted">
                  {selected.size
                    ? `${selected.size} of ${visiblePhotos.length} picked`
                    : 'Tap any photo to pick it'}
                </p>

                <div className="ml-auto flex items-center gap-2">
                  {selected.size > 0 && (
                    <button
                      onClick={() => setSelected(new Set())}
                      className="cg-chip px-3 py-1.5 font-body text-xs font-medium text-ink-muted underline underline-offset-2 hover:text-ink"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={selectAllVisible}
                    className="cg-chip border border-line-strong bg-white px-3.5 py-1.5 font-body text-xs font-medium text-ink-soft hover:border-accent"
                  >
                    <CheckIcon size={12} />
                    Select all {filter === 'favourites' ? 'favourites' : visiblePhotos.length}
                  </button>
                  <button
                    onClick={exitSelectMode}
                    className="cg-chip border border-line-strong bg-white px-3.5 py-1.5 font-body text-xs font-medium text-ink-soft hover:border-accent"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Grid ──────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-10">
        {visiblePhotos.length === 0 ? (
          <div className="py-24 text-center">
            <HeartIcon size={26} className="mx-auto text-ink-faint" />
            <p className="mt-4 font-display text-xl font-light text-ink">
              No favourites yet
            </p>
            <p className="mt-1 font-body text-sm text-ink-muted">
              Tap the heart on any photo to shortlist it.
            </p>
          </div>
        ) : (
          <Masonry
            breakpointCols={breakpointColumns}
            className="masonry-grid"
            columnClassName="masonry-grid-column"
          >
            {visiblePhotos.map((photo, index) => (
              <PhotoTile
                key={photo._id}
                photo={photo}
                position={photo.position}
                index={index}
                selectMode={selectMode}
                selected={selected.has(photo.public_id)}
                favorite={favourites.has(photo.public_id)}
                downloading={singleDownloadId === photo._id}
                onOpen={() => {
                  setLightboxIndex(index);
                  setLightboxOpen(true);
                }}
                onToggleSelect={() => toggleSelected(photo.public_id)}
                onToggleFavorite={() => toggleFavourite(photo.public_id)}
                onDownload={() =>
                  handleSingleDownload(photo.public_id, photo.fileName, photo._id)
                }
              />
            ))}
          </Masonry>
        )}
      </main>

      <Footer config={config} />

      {/* ── Selection bar ─────────────────────────────────────────── */}
      {selectMode && selectedCount > 0 && (
        <div className="cg-selection-bar fixed bottom-5 left-1/2 z-[150] w-[min(560px,calc(100vw-1.5rem))] -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-obsidian/95 px-3 py-2.5 pl-5 text-white shadow-lift backdrop-blur-xl">
            <p className="font-body text-sm">
              <span className="font-semibold tabular-nums">{selectedCount}</span>
              <span className="text-white/60"> selected</span>
            </p>
            <button
              onClick={() => setSelected(new Set())}
              className="font-body text-xs text-white/55 underline underline-offset-2 transition-colors hover:text-white"
            >
              Clear
            </button>
            <div className="ml-auto flex items-center gap-2">
              <DownloadMenu
                label="Download"
                count={selectedCount}
                disabled={busy}
                direction="up"
                variant="dark"
                onPick={(mode) => startDownload(mode, 'selected')}
              />
              <button
                onClick={exitSelectMode}
                className="hidden rounded-full px-3 py-2 font-body text-xs text-white/60 transition-colors hover:text-white sm:block"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <DownloadDock state={downloadState} onCancel={cancel} onDismiss={dismiss} />

      {lightboxOpen && lightboxPhotos.length > 0 && (
        <ClientLightbox
          photos={lightboxPhotos}
          currentIndex={Math.min(lightboxIndex, lightboxPhotos.length - 1)}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
          slug={slug}
          token={token}
          totalInGallery={orderedPhotos.length}
          favourites={favourites}
          onToggleFavourite={toggleFavourite}
          onSessionExpired={handleSessionExpired}
        />
      )}
    </div>
  );
}
