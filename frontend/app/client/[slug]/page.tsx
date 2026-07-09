'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Masonry from 'react-masonry-css';
import ClientLightbox from '@/components/ClientLightbox';
import { thumbnailUrl, blurUrl } from '@/lib/cloudinary';
import {
  downloadSinglePhoto,
  downloadAllPhotos,
  downloadAsFolder,
} from '@/lib/clientGalleryDownload';
import type { Photo } from '@/lib/types';

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
  photos: GalleryPhoto[];
}

export default function ClientGalleryPage({ params }: { params: { slug: string } }) {
  const [step, setStep] = useState<'unlock' | 'gallery'>('unlock');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gallery, setGallery] = useState<GalleryData | null>(null);
  const [token, setToken] = useState<string>('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Download states
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingFolder, setDownloadingFolder] = useState(false);
  const [downloadingPhotoId, setDownloadingPhotoId] = useState<string | null>(null);

  // Fetch gallery data using token
  const fetchGallery = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/client-gallery/${params.slug}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (!res.ok) {
        sessionStorage.removeItem(`gallery_token_${params.slug}`);
        setStep('unlock');
        return;
      }

      const data = await res.json();
      setGallery(data);
      setToken(authToken);
      setStep('gallery');
    } catch {
      sessionStorage.removeItem(`gallery_token_${params.slug}`);
      setStep('unlock');
    }
  }, [params.slug]);

  // Check if token already exists in sessionStorage
  useEffect(() => {
    const savedToken = sessionStorage.getItem(`gallery_token_${params.slug}`);
    if (savedToken) {
      fetchGallery(savedToken);
    }
  }, [params.slug, fetchGallery]);

  const handleSessionExpired = useCallback(() => {
    sessionStorage.removeItem(`gallery_token_${params.slug}`);
    setToken('');
    setGallery(null);
    setStep('unlock');
    setError('Session expired. Please enter password again.');
  }, [params.slug]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/client-gallery/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: params.slug, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid password');
        setLoading(false);
        return;
      }

      // Store token in sessionStorage (cleared when browser closes)
      sessionStorage.setItem(`gallery_token_${params.slug}`, data.token);
      await fetchGallery(data.token);
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Convert gallery photos to Photo type for ClientLightbox
  const lightboxPhotos: (Photo & { original_format: string })[] = gallery?.photos
    ?.sort((a, b) => a.order - b.order)
    .map((p) => ({
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
    })) || [];

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  // Individual photo download from grid
  const handlePhotoDownload = async (photo: GalleryPhoto, index: number) => {
    if (downloadingPhotoId) return;
    setDownloadingPhotoId(photo._id);

    try {
      const galleryName = (gallery?.title || 'gallery').replace(/[^a-zA-Z0-9]/g, '_');
      const format = photo.original_format || 'jpg';
      const filename = `${galleryName}_${photo.title || index + 1}.${format}`;
      await downloadSinglePhoto(params.slug, photo.public_id, token, filename);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
      }
    } finally {
      setDownloadingPhotoId(null);
    }
  };

  // Download All (flat zip)
  const handleDownloadAll = async () => {
    if (downloadingAll || !gallery) return;
    setDownloadingAll(true);

    try {
      await downloadAllPhotos(params.slug, token, gallery.title);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
      }
    } finally {
      setDownloadingAll(false);
    }
  };

  // Download as Folder (zip with subfolder)
  const handleDownloadFolder = async () => {
    if (downloadingFolder || !gallery) return;
    setDownloadingFolder(true);

    try {
      await downloadAsFolder(params.slug, token, gallery.title);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
      }
    } finally {
      setDownloadingFolder(false);
    }
  };

  // ═══ STEP 1: Unlock Screen ═══
  if (step === 'unlock') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          {/* Lock Icon */}
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1 className="font-display text-2xl font-light text-text-primary mb-2">
            Private Gallery
          </h1>
          <p className="font-body text-sm text-text-muted mb-8">
            Enter the password to view your photos
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 font-body text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/20 transition-all text-center"
              autoFocus
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1A1A1A] text-white font-body text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all"
            >
              {loading ? 'Verifying...' : 'Unlock Gallery'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ═══ STEP 2: Gallery View ═══
  const breakpointColumns = {
    default: 4,
    1024: 3,
    768: 2,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="text-center py-12 border-b border-border">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-text-muted mb-2">
          {gallery?.client_name || 'Private Gallery'}
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-light text-text-primary">
          {gallery?.title || 'Your Photos'}
        </h1>
        <p className="mt-2 font-body text-sm text-text-muted">
          {lightboxPhotos.length} photos
        </p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white text-sm font-body font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-60 transition-all"
          >
            {downloadingAll ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Preparing Download...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download All Photos
              </>
            )}
          </button>

          <button
            onClick={handleDownloadFolder}
            disabled={downloadingFolder}
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-neutral-300 text-neutral-700 text-sm font-body font-medium rounded-lg hover:bg-neutral-50 disabled:opacity-60 transition-all"
          >
            {downloadingFolder ? (
              <>
                <div className="w-4 h-4 border-2 border-neutral-400/30 border-t-neutral-600 rounded-full animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                Download as Folder
              </>
            )}
          </button>
        </div>

        {(downloadingAll || downloadingFolder) && (
          <p className="mt-3 text-xs font-body text-text-muted">
            Preparing your gallery zip. This may take a minute for large galleries...
          </p>
        )}
      </div>

      {/* Photo Grid — NO right-click protection (client owns these) */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Masonry
          breakpointCols={breakpointColumns}
          className="masonry-grid"
          columnClassName="masonry-grid-column"
        >
          {lightboxPhotos.map((photo, index) => (
            <div
              key={photo._id}
              className="mb-1 md:mb-4 break-inside-avoid group relative"
            >
              {/* Photo Card */}
              <div
                className="photo-card rounded-sm cursor-pointer"
                style={{ aspectRatio: `${photo.width}/${photo.height}` }}
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={thumbnailUrl(photo.public_id)}
                  alt={photo.title || 'Photo'}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  placeholder="blur"
                  blurDataURL={blurUrl(photo.public_id)}
                  className="object-cover"
                  draggable={false}
                />

                {/* Download button overlay (bottom-right, visible on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePhotoDownload(gallery!.photos[index], index);
                  }}
                  className="absolute bottom-2 right-2 z-10 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all"
                  title="Download Original"
                >
                  {downloadingPhotoId === photo._id ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </Masonry>
      </div>

      {/* Client Lightbox (with download button, no protection) */}
      {lightboxOpen && (
        <ClientLightbox
          photos={lightboxPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
          slug={params.slug}
          token={token}
          galleryTitle={gallery?.title || 'Gallery'}
        />
      )}
    </div>
  );
}
