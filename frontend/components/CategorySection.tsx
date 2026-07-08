'use client';

import { useState } from 'react';
import Link from 'next/link';
import PhotoGrid from './PhotoGrid';
import Lightbox from './Lightbox';
import type { Photo, Category } from '@/lib/types';

interface CategorySectionProps {
  category: Category;
  photos: Photo[];
}

export default function CategorySection({ category, photos }: CategorySectionProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (photo: Photo) => {
    const index = photos.findIndex((p) => p._id === photo._id);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxOpen(true);
  };

  // Only show first 6 photos on homepage
  const displayPhotos = photos.slice(0, 6);

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-text-primary">
              {category.name}
            </h2>
            {category.description && (
              <p className="mt-2 font-body text-sm text-text-muted max-w-lg">
                {category.description}
              </p>
            )}
          </div>
          <Link
            href={`/${category.slug}`}
            className="hidden sm:flex items-center gap-2 font-body text-sm text-text-muted hover:text-text-primary transition-colors duration-200 group"
          >
            View All
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>

        {/* Photo Grid */}
        <PhotoGrid photos={displayPhotos} onPhotoClick={openLightbox} />

        {/* Mobile "View All" */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href={`/${category.slug}`}
            className="inline-flex items-center gap-2 font-body text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            View All {category.name}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}
    </section>
  );
}
