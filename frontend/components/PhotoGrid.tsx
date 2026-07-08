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

    // Wait 1.5 seconds to ensure the main page load is completed and browser is free
    const timer = setTimeout(() => {
      const preloadCount = Math.min(20, photos.length);
      const topPhotos = photos.slice(0, preloadCount);

      const preloadImages = () => {
        topPhotos.forEach((photo) => {
          const img = new window.Image();
          img.src = fullUrl(photo.public_id);
        });
      };

      // Use requestIdleCallback if available, so preloading happens only when the browser is idle
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(preloadImages, { timeout: 4000 });
      } else {
        preloadImages();
      }
    }, 1500);

    return () => clearTimeout(timer);
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
