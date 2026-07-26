'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { fetcher } from '@/lib/fetcher';
import { blurUrl } from '@/lib/cloudinary';
import type { Photo, SiteConfig } from '@/lib/types';

interface PhotosResponse {
  photos: Photo[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

export default function InstagramFeed() {
  const { data: photosData } = useSWR<PhotosResponse>('/photos?limit=6', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const { data: config } = useSWR<SiteConfig>('/config', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3600000,
  });

  const instagramUrl = config?.social_links?.instagram || '#';
  const feedPhotos = photosData?.photos?.slice(0, 6) || [];

  if (feedPhotos.length === 0) return null;

  return (
    <section className="py-14 md:py-20 bg-surface relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 flex flex-col items-center">
          <p className="eyebrow justify-center mb-2">
            Follow Our Journey
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-text-primary">
            @{config?.photographer_name?.toLowerCase().replace(/\s+/g, '') || 'niksphotos'}
          </h2>
          <p className="mt-3 font-body text-sm text-text-muted">
            Behind the scenes, latest work, and creative inspiration
          </p>
          <div className="divider-line mx-auto mt-6 max-w-[80px]" />
        </div>

        {/* Instagram Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {feedPhotos.map((photo, idx) => (
            <InstaCard key={photo._id} photo={photo} index={idx} />
          ))}
        </div>

        {/* Follow CTA */}
        <div className="text-center mt-10">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white font-body text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            Follow on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}

function InstaCard({ photo, index }: { photo: Photo; index: number }) {
  const [liked, setLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const handleDoubleClick = () => {
    setLiked(true);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group"
      onDoubleClick={handleDoubleClick}
    >
      <Image
        src={photo.public_id}
        alt={photo.title || 'Photo'}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
        placeholder="blur"
        blurDataURL={blurUrl(photo.public_id)}
        className="object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-4 text-white">
          <div className="flex items-center gap-1.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#FF3B5C' : 'white'}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Double-tap heart animation */}
      {showHeart && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <svg width="60" height="60" viewBox="0 0 24 24" fill="#FF3B5C">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}
