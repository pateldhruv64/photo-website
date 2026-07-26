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
    <div className="mb-3 md:mb-6 break-inside-avoid">
      <div
        onClick={() => onClick(photo)}
        className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer bg-[#F0E8DF]"
        style={{ aspectRatio: `${photo.width}/${photo.height}` }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Image
          src={photo.public_id}
          alt="Photography Work"
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          placeholder="blur"
          blurDataURL={blurUrl(photo.public_id)}
          className={`object-cover protected-image transition-transform duration-700 ease-out group-hover:scale-[1.03] ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          draggable={false}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
