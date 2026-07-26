'use client';

import Image from 'next/image';
import { blurUrl } from '@/lib/cloudinary';
import type { Photo } from '@/lib/types';

interface MarqueeProps {
  photos: Photo[];
  reverse?: boolean;
  speed?: number;
}

export default function Marquee({ photos, reverse = false, speed = 30 }: MarqueeProps) {
  if (!photos || photos.length === 0) return null;

  // Ensure we have enough items to fill screen width and loop seamlessly.
  // We repeat the array an even number of times so that shifting by 50% is a perfect loop.
  const repeatCount = Math.max(4, Math.ceil(12 / photos.length));
  const evenRepeatCount = repeatCount % 2 === 0 ? repeatCount : repeatCount + 1;
  const duplicated = Array(evenRepeatCount).fill(photos).flat();

  return (
    <div className="marquee-container py-0.5 overflow-hidden group"
      onMouseEnter={(e) => {
        const content = e.currentTarget.querySelector('.marquee-content, .marquee-content-reverse') as HTMLElement;
        if (content) content.style.animationPlayState = 'paused';
      }}
      onMouseLeave={(e) => {
        const content = e.currentTarget.querySelector('.marquee-content, .marquee-content-reverse') as HTMLElement;
        if (content) content.style.animationPlayState = 'running';
      }}
    >
      <div
        className={reverse ? 'marquee-content-reverse' : 'marquee-content'}
        style={{ animationDuration: `${speed}s` }}
      >
        {duplicated.map((photo, i) => (
          <div
            key={`${photo._id}-${i}`}
            className="marquee-item flex-shrink-0 rounded-sm overflow-hidden"
            style={{
              ['--aspect-ratio']: photo.width / photo.height,
            } as React.CSSProperties}
          >
            <Image
              src={photo.public_id}
              alt={photo.title || 'Photo'}
              fill
              sizes="(max-width: 768px) 180px, 300px"
              placeholder="blur"
              blurDataURL={blurUrl(photo.public_id)}
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
