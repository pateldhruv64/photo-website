'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface InstagramWindow extends Window {
  instgrm?: {
    Embeds?: {
      process: () => void;
    };
  };
}

interface VideoLightboxProps {
  youtubeId: string;
  platform?: 'youtube' | 'instagram';
  title?: string;
  onClose: () => void;
}

export default function VideoLightbox({ youtubeId, platform = 'youtube', title, onClose }: VideoLightboxProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    if (platform === 'instagram') {
      const existingScript = document.getElementById('instagram-embed-js');
      const processInstagramEmbeds = () => {
        const win = window as unknown as InstagramWindow;
        if (win.instgrm?.Embeds) {
          win.instgrm.Embeds.process();
        }
      };

      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'instagram-embed-js';
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        script.onload = processInstagramEmbeds;
        document.body.appendChild(script);
      } else {
        setTimeout(processInstagramEmbeds, 100);
      }
    }

    return () => {
      setMounted(false);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, platform, youtubeId]);

  if (!mounted) return null;

  return createPortal(
    <div className="lightbox-overlay z-[9999]" onClick={onClose}>
      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors bg-black/40 hover:bg-black/60 rounded-full"
          aria-label="Close video"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Video Container */}
        <div
          className="w-full max-w-4xl flex justify-center items-center"
          style={{ aspectRatio: platform === 'instagram' ? 'auto' : '16/9' }}
          onClick={(e) => e.stopPropagation()}
        >
          {platform === 'instagram' ? (
            <iframe
              key={youtubeId}
              src={`https://www.instagram.com/reel/${youtubeId}/embed/`}
              className="w-full max-w-[420px] h-[85vh] min-h-[480px] bg-white rounded-lg shadow-2xl border-0"
              frameBorder="0"
              scrolling="no"
              allowTransparency
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
              title={title || 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          )}
        </div>

        {/* Title */}
        {title && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
            <p className="text-white/80 text-sm font-body">{title}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
