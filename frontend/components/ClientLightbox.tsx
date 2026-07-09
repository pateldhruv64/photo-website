'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { lightboxUrl } from '@/lib/cloudinary';
import { downloadSinglePhoto } from '@/lib/clientGalleryDownload';
import type { Photo, SiteConfig } from '@/lib/types';
import StudioCard from '@/components/StudioCard';

interface ClientLightboxProps {
  photos: (Photo & { original_format?: string })[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  slug: string;
  token: string;
  galleryTitle: string;
}

export default function ClientLightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
  slug,
  token,
  galleryTitle,
}: ClientLightboxProps) {
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState('');
  const [studioCardOpen, setStudioCardOpen] = useState(false);

  // Draggable logo button state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number; moved: boolean } | null>(null);

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
    
    const dy = clientY - dragRef.current.startY;
    const dx = clientX - dragRef.current.startX;
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragRef.current.moved = true;
    }
    
    setPosition(() => ({
      x: dragRef.current!.posX + dx,
      y: dragRef.current!.posY + dy,
    }));
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

  const { data: config } = useSWR<SiteConfig>('/config', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  // Touch swipe state
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

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

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 50) {
        goPrev();
      } else if (deltaX < -50) {
        goNext();
      }
    }
  }, [goNext, goPrev]);

  // Download handler
  const handleDownload = useCallback(async () => {
    if (downloading || !photo) return;
    setDownloading(true);
    setDownloadMsg('Downloading...');

    try {
      const format = photo.original_format || 'jpg';
      const galleryName = galleryTitle.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${galleryName}_${photo.title || currentIndex + 1}.${format}`;
      await downloadSinglePhoto(slug, photo.public_id, token, filename);
      setDownloadMsg('Downloaded!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '';
      if (errorMsg === 'SESSION_EXPIRED') {
        setDownloadMsg('Session expired');
      } else {
        setDownloadMsg('Failed');
      }
    } finally {
      setDownloading(false);
      setTimeout(() => setDownloadMsg(''), 2000);
    }
  }, [downloading, photo, slug, token, galleryTitle, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      setMounted(false);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, goNext, goPrev]);

  if (!mounted || !photo) return null;

  return createPortal(
    <div
      className="lightbox-overlay z-[9999]"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
        {/* Top Center Brand Logo Circular Button (Draggable) */}
        <div 
          className={`absolute top-10 md:top-12 left-1/2 z-50 transition-opacity duration-300 cursor-grab active:cursor-grabbing ${
            studioCardOpen ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'
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
            className="w-16 h-16 rounded-full bg-white border border-[#E6E4DD] shadow-lg flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
            title="Open Studio Info"
          >
            {config?.studio_logo?.secure_url ? (
              <img
                src={config.studio_logo.secure_url}
                alt="Studio Logo"
                className="object-cover w-full h-full pointer-events-none"
              />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="2" className="pointer-events-none">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            )}
          </button>
        </div>
        {/* Top Right: Close + Download */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          {/* Download status message */}
          {downloadMsg && (
            <span className="text-white/80 text-xs font-body bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
              {downloadMsg}
            </span>
          )}

          {/* Download Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            disabled={downloading}
            className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Download original"
            title="Download Original"
          >
            {downloading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
          </button>

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label="Close lightbox"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Prev Button */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            aria-label="Previous photo"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Next Button */}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            aria-label="Next photo"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Image — NO right-click protection for client gallery */}
        <div
          className="relative max-w-full max-h-full"
          style={{ aspectRatio: `${photo.width}/${photo.height}` }}
          onClick={(e) => e.stopPropagation()}
        >
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <Image
            src={lightboxUrl(photo.public_id)}
            alt={photo.title || 'Photo'}
            width={photo.width}
            height={photo.height}
            className={`max-h-[85vh] w-auto h-auto object-contain transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setLoaded(true)}
            draggable={false}
          />
        </div>

        {/* Photo info */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
          {photo.title && (
            <p className="text-white/80 text-sm font-body mb-1">{photo.title}</p>
          )}
          <p className="text-white/40 text-xs font-body">
            {currentIndex + 1} / {photos.length}
          </p>
        </div>
      </div>

      {/* Studio Info Modal Overlay */}
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
