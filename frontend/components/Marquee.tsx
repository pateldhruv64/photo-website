'use client';

import Image from 'next/image';
import { thumbnailUrl, blurUrl } from '@/lib/cloudinary';
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
    <div className="marquee-container py-2 overflow-hidden">
      <div
        className={reverse ? 'marquee-content-reverse' : 'marquee-content'}
        style={{ animationDuration: `${speed}s` }}
      >
        {duplicated.map((photo, i) => (
          <div
            key={`${photo._id}-${i}`}
            className="flex-shrink-0 mx-2 rounded-sm overflow-hidden"
            style={{
              width: `${Math.round((photo.width / photo.height) * 200)}px`,
              height: '200px',
            }}
          >
            <Image
              src={thumbnailUrl(photo.public_id, 400)}
              alt={photo.title || 'Photo'}
              width={Math.round((photo.width / photo.height) * 200)}
              height={200}
              placeholder="blur"
              blurDataURL={blurUrl(photo.public_id)}
              className="object-cover w-full h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
