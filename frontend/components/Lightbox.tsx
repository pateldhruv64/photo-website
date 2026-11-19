'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSiteConfig } from '@/lib/hooks';
import { useLightboxGestures } from '@/lib/useLightboxGestures';
import { lightboxUrl } from '@/lib/cloudinary';
import type { Photo } from '@/lib/types';
import StudioCard from '@/components/StudioCard';

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({ photos, currentIndex, onClose, onNavigate }: LightboxProps) {
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [studioCardOpen, setStudioCardOpen] = useState(false);

  // Draggable button state
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
    
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragRef.current.moved = true;
    }
    
    const initialX = dragRef.current.posX;
    const initialY = dragRef.current.posY;

    setPosition({
      x: initialX + dx,
      y: initialY + dy,
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

  /* Bagal me swipe = photo badlo, neeche swipe = band. Poori tafseel
     lib/useLightboxGestures.ts me hai — client gallery bhi wahi hook
     use karti hai, taki gesture dono jagah ek jaisa lage. */
  const { stageRef, overlayRef, onTouchStart, onTouchMove, onTouchEnd, onOverlayClick } =
    useLightboxGestures({ onClose, onNext: goNext, onPrev: goPrev });

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

  /* Sirf aage/peeche wali photo prefetch karo.
     Pehle PhotoGrid page load par hi 40+ full-size images kheench leta
     tha. Ab sirf 2 — aur wahi jinki user ko agle click par zarurat hai.
     Navigation utna hi instant lagta hai, data ka kharcha 95% kam. */
  useEffect(() => {
    const neighbours = [photos[currentIndex + 1], photos[currentIndex - 1]].filter(Boolean);
    const imgs = neighbours.map((p) => {
      const img = new window.Image();
      img.src = lightboxUrl(p.public_id);
      return img;
    });
    return () => {
      // Abort pending downloads agar user jaldi close kar de
      imgs.forEach((img) => {
        img.src = '';
      });
    };
  }, [currentIndex, photos]);

  if (!mounted || !photo) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="lightbox-overlay z-[9999]"
      onClick={onOverlayClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="relative w-full h-full flex items-center justify-center p-4 md:p-8"
      >
        {/* Close Button — Apple HIG Frosted Glass Pill */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 z-50 h-11 w-11 rounded-full bg-black/40 hover:bg-black/60 active:scale-90 text-white/80 hover:text-white backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-2xl transition-all duration-300"
          aria-label="Close lightbox"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

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
            className="w-16 h-16 rounded-full bg-white border border-[#D6E6F2] shadow-lg flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
            title="Open Studio Info"
          >
            {config?.studio_logo?.secure_url ? (
              <img
                src={config.studio_logo.secure_url}
                alt="Studio Logo"
                className="object-cover w-full h-full pointer-events-none"
              />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#476485" strokeWidth="2" className="pointer-events-none">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            )}
          </button>
        </div>

        {/* Prev Button — Apple HIG Glass Pill */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-2.5 md:left-6 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-black/40 hover:bg-black/60 active:scale-90 text-white/80 hover:text-white backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-2xl transition-all duration-300"
            aria-label="Previous photo"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Next Button — Apple HIG Glass Pill */}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-2.5 md:right-6 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-black/40 hover:bg-black/60 active:scale-90 text-white/80 hover:text-white backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-2xl transition-all duration-300"
            aria-label="Next photo"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Bottom Apple HIG Telemetry Capsule */}
        <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full bg-black/50 px-4 py-1.5 text-white/90 backdrop-blur-2xl border border-white/15 shadow-2xl">
          <span className="font-mono text-[11px] tabular text-white/70">
            {currentIndex + 1} / {photos.length}
          </span>
          {photo?.title && <span className="h-3 w-px bg-white/20" />}
          {photo?.title && (
            <span className="font-display italic text-xs truncate max-w-[180px] sm:max-w-xs text-white/90">
              {photo.title}
            </span>
          )}
        </div>

        {/* Image — swipe-to-dismiss ke dauraan yahi element chalta hai */}
        <div
          ref={stageRef}
          className="relative max-w-full max-h-full protected-image will-change-transform"
          style={{ aspectRatio: `${photo.width}/${photo.height}` }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Loading spinner */}
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <img
            src={lightboxUrl(photo.public_id)}
            alt={photo.title || 'Photo'}
            className={`max-h-[85vh] w-auto h-auto object-contain transition-opacity duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setLoaded(true)}
            draggable={false}
          />
        </div>

        {/* Photo info */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
          <p className="text-white/40 text-xs font-body">
            {currentIndex + 1} / {photos.length}
          </p>
        </div>

        {config && (
          <StudioCard
            config={config}
            isOpen={studioCardOpen}
            onClose={() => setStudioCardOpen(false)}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
