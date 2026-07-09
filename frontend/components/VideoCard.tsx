'use client';

import Image from 'next/image';
import type { VideoItem } from '@/lib/types';

interface VideoCardProps {
  video: VideoItem;
  onClick: (video: VideoItem) => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <div className="mb-1 md:mb-4 break-inside-avoid">
      <div
        className="photo-card rounded-sm relative cursor-pointer"
        style={{ aspectRatio: '16/9' }}
        onClick={() => onClick(video)}
      >
        <Image
          src={video.thumbnail_url}
          alt={video.title || 'Video'}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          unoptimized
        />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#1A1A1A" className="ml-1">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>

        {/* Video badge */}
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-body tracking-wider uppercase rounded-full">
          Video
        </div>
      </div>

      {/* Title */}
      {video.title && (
        <p className="mt-1.5 font-body text-xs text-text-muted truncate px-0.5">
          {video.title}
        </p>
      )}
    </div>
  );
}
