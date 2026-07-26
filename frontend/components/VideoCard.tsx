import { useState } from 'react';
import type { VideoItem } from '@/lib/types';

interface VideoCardProps {
  video: VideoItem;
  onClick: (video: VideoItem) => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  const [imageError, setImageError] = useState(false);

  const getThumbnailUrl = () => {
    if (video.thumbnail_url && !imageError) {
      if (video.platform === 'youtube') {
        return video.thumbnail_url.replace('maxresdefault.jpg', 'hqdefault.jpg');
      }
      return video.thumbnail_url;
    }
    if (video.platform === 'youtube') {
      return `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;
    }
    return null;
  };

  const thumbUrl = getThumbnailUrl();

  return (
    <div className="mb-1 md:mb-4 break-inside-avoid">
      <div
        className="photo-card rounded-sm relative cursor-pointer group overflow-hidden"
        style={{ aspectRatio: '16/9' }}
        onClick={() => onClick(video)}
      >
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={video.title || 'Video'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 group-hover:bg-black/40 transition-colors">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#1E1410" className="ml-1">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>

        {/* Video badge */}
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-body tracking-wider uppercase rounded-full">
          {video.platform === 'instagram' ? 'Reel' : 'Video'}
        </div>
      </div>
    </div>
  );
}
