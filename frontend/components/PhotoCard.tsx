'use client';

import { useState } from 'react';
import Image from 'next/image';
import { blurUrl } from '@/lib/cloudinary';
import type { Photo } from '@/lib/types';

interface PhotoCardProps {
  photo: Photo;
  onClick: (photo: Photo) => void;
}

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="mb-1 md:mb-4 break-inside-avoid">
      <div
        data-tilt
        className="photo-card rounded-sm transition-transform duration-100"
        style={{ aspectRatio: `${photo.width}/${photo.height}`, willChange: 'transform' }}
        onClick={() => onClick(photo)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Image
          src={photo.public_id}
          alt={photo.title || 'Photo'}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          placeholder="blur"
          blurDataURL={blurUrl(photo.public_id)}
          className={`object-cover protected-image transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          draggable={false}
          onLoad={() => setLoaded(true)}
        />
        
        {/* Caption overlay on hover */}
        <div className="caption-overlay">
          <p className="text-white text-sm font-body drop-shadow-lg font-medium">
            {photo.title || 'Photo'}
          </p>
        </div>
      </div>
    </div>
  );
}
