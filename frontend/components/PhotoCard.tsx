'use client';

import Image from 'next/image';
import { thumbnailUrl, blurUrl } from '@/lib/cloudinary';
import type { Photo } from '@/lib/types';

interface PhotoCardProps {
  photo: Photo;
  onClick: (photo: Photo) => void;
}

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
  return (
    <div className="mb-1 md:mb-4 break-inside-avoid">
      <div
        className="photo-card rounded-sm"
        style={{ aspectRatio: `${photo.width}/${photo.height}` }}
        onClick={() => onClick(photo)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Image
          src={thumbnailUrl(photo.public_id)}
          alt={photo.title || 'Photo'}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          placeholder="blur"
          blurDataURL={blurUrl(photo.public_id)}
          className="object-cover protected-image"
          draggable={false}
        />
        
        {/* Title overlay on hover */}
        {photo.title && (
          <div className="absolute bottom-0 left-0 right-0 p-3 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
            <p className="text-white text-sm font-body drop-shadow-lg">
              {photo.title}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
