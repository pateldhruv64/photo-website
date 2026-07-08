'use client';

import { useEffect } from 'react';
import Masonry from 'react-masonry-css';
import PhotoCard from './PhotoCard';
import { fullUrl } from '@/lib/cloudinary';
import type { Photo } from '@/lib/types';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}

const breakpointColumns = {
  default: 4,
  1280: 3,
  768: 2,
  640: 1,
};

export default function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  useEffect(() => {
    if (!photos || photos.length === 0) return;

    let active = true;
    let timeoutId: NodeJS.Timeout;

    const preloadBatches = async () => {
      // Wait 1.5s initially to let the main page load completely
      await new Promise((resolve) => {
        timeoutId = setTimeout(resolve, 1500);
      });
      if (!active) return;

      // Batch 1: First 20 photos (likely what user will view first)
      const batch1 = photos.slice(0, 20);
      preloadPhotos(batch1);

      // Remaining batches: 10 photos each, spaced 5 seconds apart
      let currentIndex = 20;
      while (currentIndex < photos.length && active) {
        await new Promise((resolve) => {
          timeoutId = setTimeout(resolve, 5000);
        });
        if (!active) return;

        const nextBatch = photos.slice(currentIndex, currentIndex + 10);
        preloadPhotos(nextBatch);
        currentIndex += 10;
      }
    };

    const preloadPhotos = (photoBatch: Photo[]) => {
      const loadImg = () => {
        photoBatch.forEach((photo) => {
          const img = new window.Image();
          img.src = fullUrl(photo.public_id);
        });
      };

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(loadImg, { timeout: 4000 });
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
