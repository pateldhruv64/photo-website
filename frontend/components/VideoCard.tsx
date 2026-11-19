'use client';

import { useState } from 'react';
import type { VideoItem } from '@/lib/types';

interface VideoCardProps {
  video: VideoItem;
  onClick: (video: VideoItem) => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  const [broken, setBroken] = useState(false);

  const isReel = video.platform === 'instagram';

  /* Thumbnail resolve karne ka kram:
     1. saved thumbnail (Instagram reels ke liye ab Cloudinary par mirror
        hota hai, to yeh expire nahi hota)
     2. YouTube ka predictable URL
     3. kuch nahi → branded placeholder (neeche)

     Dead cdninstagram URLs ko yaha hi reject kar dete hain — wo signed
     hote hain aur expire ho chuke hote hain, to load hone ka intezaar
     karne ka koi matlab nahi. */
  const saved =
    video.thumbnail_url &&
    !video.thumbnail_url.includes('cdninstagram.com') &&
    !video.thumbnail_url.includes('fbcdn.net') &&
    video.thumbnail_url !== '/images/instagram-placeholder.png'
      ? video.thumbnail_url
      : '';

  const thumb = broken
    ? ''
    : saved ||
      (video.platform === 'youtube'
        ? `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`
        : '');

  return (
    <button
      type="button"
      onClick={() => onClick(video)}
      aria-label={`Play ${video.title || (isReel ? 'reel' : 'video')}`}
      className="group relative block w-full overflow-hidden rounded-2xl bg-hover-surface shadow-[0_4px_20px_-4px_rgba(20,36,51,0.12)] transition-all duration-500 ease-editorial hover:shadow-[0_20px_48px_-12px_rgba(20,36,51,0.26)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-deep focus-visible:ring-offset-2"
      style={{ aspectRatio: '16/9' }}
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={video.title || (isReel ? 'Instagram reel' : 'Video')}
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
        />
      ) : (
        /* Branded placeholder — pehle yaha khaali grey box aata tha jo
           toota hua lagta tha. Ab yeh jaan-boojh kar banaya gaya design
           lagta hai. */
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-obsidian-soft via-obsidian to-[#0D1A26]">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 30%, #B9D7EA 0%, transparent 55%), radial-gradient(circle at 75% 70%, #769FCD 0%, transparent 55%)',
            }}
          />
          <span className="relative flex flex-col items-center gap-2 text-white/45">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              {isReel ? (
                <>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </>
              ) : (
                <>
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </>
              )}
            </svg>
            <span className="font-body text-[9px] uppercase tracking-[0.24em]">
              {isReel ? 'Reel' : 'Film'}
            </span>
          </span>
        </div>
      )}

      {/* Subtle Specular Inner Rim */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20 transition-colors group-hover:ring-white/40" />

      {/* Play button */}
      <span className="absolute inset-0 flex items-center justify-center bg-ink/15 transition-colors duration-500 group-hover:bg-ink/35">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/92 shadow-2xl backdrop-blur-md border border-white/50 transition-transform duration-500 ease-editorial group-hover:scale-110 active:scale-95">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 text-ink">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </span>
      </span>

      {/* Platform badge */}
      <span className="absolute left-2.5 top-2.5 rounded-full bg-ink/65 px-2.5 py-1 font-body text-[9px] uppercase tracking-[0.16em] text-white backdrop-blur-sm">
        {isReel ? 'Reel' : 'Video'}
      </span>

      {video.title && (
        <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-ink/80 to-transparent px-3 pb-2.5 pt-8 text-left font-body text-[11px] text-white/95">
          {video.title}
        </span>
      )}
    </button>
  );
}
