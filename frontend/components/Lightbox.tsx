'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { fullUrl } from '@/lib/cloudinary';
import type { Photo } from '@/lib/types';

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({ photos, currentIndex, onClose, onNavigate }: LightboxProps) {
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
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
    <div className="lightbox-overlay z-[9999]" onClick={onClose}>
      <div
        className="relative w-full h-full flex items-center justify-center p-4 md:p-8"
      >
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          aria-label="Close lightbox"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

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

        {/* Image */}
        <div 
          className="relative max-w-full max-h-full" 
          style={{ aspectRatio: `${photo.width}/${photo.height}` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Loading spinner */}
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <Image
            src={fullUrl(photo.public_id)}
            alt={photo.title || 'Photo'}
            width={photo.width}
            height={photo.height}
            unoptimized
            className={`max-h-[85vh] w-auto h-auto object-contain transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setLoaded(true)}
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
    </div>,
    document.body
  );
}
