'use client';

import { useState } from 'react';
import Image from 'next/image';
import { blurUrl } from '@/lib/cloudinary';
import type { Photo } from '@/lib/types';
import TiltCard from '@/components/ui/TiltCard';

interface PhotoCardProps {
  photo: Photo;
  onClick: (photo: Photo) => void;
}

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="mb-3 md:mb-6 break-inside-avoid">
      <TiltCard
        maxTilt={8}
        glareOpacity={0.2}
        spotlightColor="rgba(255, 255, 255, 0.12)"
        onClick={() => onClick(photo)}
        className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-black/5"
      >
        <div
          className="relative w-full overflow-hidden bg-[#F0E8DF]"
          style={{ aspectRatio: `${photo.width}/${photo.height}` }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Image
            src={photo.public_id}
            alt={photo.title || 'Photography Work'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            placeholder="blur"
            blurDataURL={blurUrl(photo.public_id)}
            className={`object-cover protected-image transition-all duration-700 group-hover:scale-105 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            draggable={false}
            onLoad={() => setLoaded(true)}
          />

          {/* Hover Overlay with Inspira UI subtle badge & title */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            {photo.title && (
              <p className="font-display text-white font-medium text-sm tracking-wide transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                {photo.title}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-white/80 mt-1">
              <span>View Image</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>
      </TiltCard>
    </div>
  );
}
