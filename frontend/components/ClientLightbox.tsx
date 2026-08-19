'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { lightboxUrl } from '@/lib/cloudinary';
import { downloadSinglePhoto } from '@/lib/galleryDownload';
import { useSiteConfig } from '@/lib/hooks';
import { useLightboxGestures } from '@/lib/useLightboxGestures';
import type { Photo } from '@/lib/types';
import StudioCard from '@/components/StudioCard';
import {
  CameraIcon,
  CheckIcon,
  CloseIcon,
  DownloadIcon,
  HeartIcon,
} from '@/components/client/icons';

export interface LightboxPhoto extends Photo {
  original_format: string;
  /** Download hone par yahi naam banega — gallery ke order se. */
  fileName: string;
  /** Poori gallery me iska number (favourites filter se badalta nahi). */
  position: number;
}

interface ClientLightboxProps {
  photos: LightboxPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  slug: string;
  token: string;
  totalInGallery: number;
  favourites: Set<string>;
  onToggleFavourite: (publicId: string) => void;
  onSessionExpired: () => void;
}

export default function ClientLightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
  slug,
  token,
  totalInGallery,
  favourites,
  onToggleFavourite,
  onSessionExpired,
}: ClientLightboxProps) {
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState('');
  const [studioCardOpen, setStudioCardOpen] = useState(false);

  // Draggable logo button state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    posX: number;
    posY: number;
    moved: boolean;
  } | null>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      posX: position.x,
      posY: position.y,
      moved: false,
    };
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.moved = true;

    setPosition({
      x: dragRef.current.posX + dx,
      y: dragRef.current.posY + dy,
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (dragRef.current) handleDragMove(e);
    };
    const handleEnd = () => {
      if (dragRef.current) handleDragEnd();
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  const config = useSiteConfig();
  const photo = photos[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setLoaded(false);
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, photos.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setLoaded(false);
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  /* Wahi gestures jo public gallery ke lightbox me hain — bagal me
     swipe se photo badalti hai, neeche swipe se band hota hai. */
  const { stageRef, overlayRef, onTouchStart, onTouchMove, onTouchEnd, onOverlayClick } =
    useLightboxGestures({ onClose, onNext: goNext, onPrev: goPrev });

  /**
   * Sirf aas-paas ki photos preload hoti hain.
   *
   * Pehle gallery page poori gallery ki full-size images background me
   * preload karta tha — 200 photos wali gallery me yeh sainkdon MB
   * bekaar kharch karta tha aur usi bandwidth ko khaata tha jo client ke
   * asli download ko chahiye hoti hai. Do aage, ek peeche — bas itna hi
   * chahiye taaki next/prev instant lage.
   */
  useEffect(() => {
    [currentIndex + 1, currentIndex + 2, currentIndex - 1]
      .filter((i) => i >= 0 && i < photos.length)
      .forEach((i) => {
        const img = new window.Image();
        img.src = lightboxUrl(photos[i].public_id);
      });
  }, [currentIndex, photos]);

  const handleDownload = useCallback(async () => {
    if (downloading || !photo) return;
    setDownloading(true);
    setDownloadMsg('Starting…');

    try {
      await downloadSinglePhoto(slug, photo.public_id, token, photo.fileName);
      setDownloadMsg('Saved');
    } catch (err) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        setDownloadMsg('Session expired');
        onSessionExpired();
      } else {
        setDownloadMsg('Failed');
      }
    } finally {
      setDownloading(false);
      setTimeout(() => setDownloadMsg(''), 2200);
    }
  }, [downloading, photo, slug, token, onSessionExpired]);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'd' || e.key === 'D') handleDownload();
      if (e.key === 'f' || e.key === 'F') {
        if (photo) onToggleFavourite(photo.public_id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      setMounted(false);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, goNext, goPrev, handleDownload, onToggleFavourite, photo]);

  if (!mounted || !photo) return null;

  const isFavourite = favourites.has(photo.public_id);

  return createPortal(
    <div
      ref={overlayRef}
      className="lightbox-overlay z-[9999]"
      onClick={onOverlayClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative flex h-full w-full items-center justify-center p-4 md:p-8">
        {/* Top Center Brand Logo Circular Button (Draggable) */}
        <div
          className={`absolute left-1/2 top-10 z-50 cursor-grab transition-opacity duration-300 active:cursor-grabbing md:top-12 ${
            studioCardOpen ? 'pointer-events-none scale-75 opacity-0' : 'scale-100 opacity-100'
          }`}
          style={{ transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)` }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (dragRef.current?.moved) return;
              setStudioCardOpen(true);
            }}
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#D6E6F2] bg-white shadow-lg transition-transform active:scale-95"
            title="Open Studio Info"
          >
            {config?.studio_logo?.secure_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.studio_logo.secure_url}
                alt="Studio Logo"
                className="pointer-events-none h-full w-full object-cover"
              />
            ) : (
              <CameraIcon size={24} className="pointer-events-none text-[#476485]" />
            )}
          </button>
        </div>

        {/* Top Right: favourite + download + close */}
        <div className="absolute right-4 top-4 z-50 flex items-center gap-1">
          {downloadMsg && (
            <span className="mr-1 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 font-body text-xs text-white/85 backdrop-blur-sm">
              {downloadMsg === 'Saved' && <CheckIcon size={12} />}
              {downloadMsg}
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavourite(photo.public_id);
            }}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              isFavourite ? 'text-red-400' : 'text-white/70 hover:text-white'
            }`}
            aria-label={isFavourite ? 'Remove from favourites' : 'Mark as favourite'}
            title="Favourite (F)"
          >
            <HeartIcon size={21} filled={isFavourite} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            disabled={downloading}
            className="flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:text-white disabled:opacity-50"
            aria-label="Download original"
            title="Download original (D)"
          >
            {downloading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <DownloadIcon size={21} strokeWidth={1.5} />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:text-white"
            aria-label="Close lightbox"
          >
            <CloseIcon size={22} strokeWidth={1.5} />
          </button>
        </div>

        {currentIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-2 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-white/60 transition-colors hover:text-white md:left-6"
            aria-label="Previous photo"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {currentIndex < photos.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-2 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-white/60 transition-colors hover:text-white md:right-6"
            aria-label="Next photo"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Image — client apni photos ka maalik hai, isliye yahan koi
            right-click protection nahi hai. */}
        <div
          ref={stageRef}
          className="relative max-h-full max-w-full will-change-transform"
          style={{ aspectRatio: `${photo.width}/${photo.height}` }}
          onClick={(e) => e.stopPropagation()}
        >
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl(photo.public_id)}
            alt={photo.title || `Photo ${photo.position}`}
            className={`h-auto max-h-[85vh] w-auto object-contain transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setLoaded(true)}
            draggable={false}
          />
        </div>

        {/* Counter — gallery ka asli number, taaki client aur photographer
            dono ek hi photo ki baat karein. */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
          <p className="font-body text-xs tabular-nums text-white/45">
            {photo.position} / {totalInGallery}
            {photos.length !== totalInGallery && (
              <span className="text-white/30"> · favourites</span>
            )}
          </p>
        </div>
      </div>

      {config && (
        <StudioCard
          config={config}
          isOpen={studioCardOpen}
          onClose={() => setStudioCardOpen(false)}
        />
      )}
    </div>,
    document.body
  );
}
