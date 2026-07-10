'use client';

import { useEffect } from 'react';
import Masonry from 'react-masonry-css';
import PhotoCard from './PhotoCard';
import { lightboxUrl } from '@/lib/cloudinary';
import type { Photo } from '@/lib/types';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}

const breakpointColumns = {
  default: 4,
  1024: 3,
  768: 3, // Mobile screens will display 3 columns of photos, making them compact
};

// Global memory to track which photos have already been preloaded
const preloadedPhotos = new Set<string>();

export default function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  useEffect(() => {
    if (!photos || photos.length === 0) return;

    // Filter out photos that have already been preloaded
    const photosToPreload = photos.filter(p => !preloadedPhotos.has(p._id));
    if (photosToPreload.length === 0) return;

    let active = true;
    let timeoutId: NodeJS.Timeout;

    const preloadBatches = async () => {
      // Wait 1.5s initially to let the main page load completely
      await new Promise((resolve) => {
        timeoutId = setTimeout(resolve, 1500);
      });
      if (!active) return;

      // Batch 1: First 40 new photos (as requested by user)
      const batch1 = photosToPreload.slice(0, 40);
      preloadPhotos(batch1);

      // Remaining batches: 10 photos each, spaced 5 seconds apart
      let currentIndex = 40;
      while (currentIndex < photosToPreload.length && active) {
        await new Promise((resolve) => {
          timeoutId = setTimeout(resolve, 5000);
        });
        if (!active) return;

        const nextBatch = photosToPreload.slice(currentIndex, currentIndex + 10);
        preloadPhotos(nextBatch);
        currentIndex += 10;
      }
    };

    const preloadPhotos = (photoBatch: Photo[]) => {
      const loadImg = () => {
        photoBatch.forEach((photo) => {
          if (!preloadedPhotos.has(photo._id)) {
            const img = new window.Image();
            img.src = lightboxUrl(photo.public_id);
            preloadedPhotos.add(photo._id);
          }
        });
      };

      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => void }).requestIdleCallback?.(loadImg, { timeout: 4000 });
      } else {
        loadImg();
      }
    };

    preloadBatches();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [photos]);

  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="masonry-grid"
      columnClassName="masonry-grid-column"
    >
      {photos.map((photo) => (
        <PhotoCard
          key={photo._id}
          photo={photo}
          onClick={onPhotoClick}
        />
      ))}
    </Masonry>
  );
}
