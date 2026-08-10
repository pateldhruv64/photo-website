'use client';

import { useState } from 'react';
import Image from 'next/image';
import { blurUrl } from '@/lib/cloudinary';
import type { Photo } from '@/lib/types';

interface PhotoCardProps {
  photo: Photo;
  onClick: (photo: Photo) => void;
  /** Grid me index — pehli few images priority se load hoti hain (LCP) */
  index?: number;
}

export default function PhotoCard({ photo, onClick, index = 99 }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);

  // Alt text backend se aata hai (blank ho to wahi auto-generate karta hai).
  // Yaha last-resort fallback hai taki alt kabhi khaali na jaaye.
  const alt =
    photo.alt_text ||
    photo.title ||
    (typeof photo.category === 'object' && photo.category?.name
      ? `${photo.category.name} photography`
      : 'Professional photography');

  // Pehli 4 images above the fold hoti hain — inhe eager load karo
  const isPriority = index < 4;

  return (
    <figure className="mb-3 md:mb-5 break-inside-avoid">
      <button
        type="button"
        onClick={() => onClick(photo)}
        aria-label={`Open ${alt} in full screen`}
        className="group relative block w-full overflow-hidden rounded-xl md:rounded-2xl bg-hover-surface shadow-[0_1px_2px_rgba(20,36,51,0.04)] transition-shadow duration-500 will-change-transform hover:shadow-[0_18px_48px_-12px_rgba(20,36,51,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        style={{ aspectRatio: `${photo.width}/${photo.height}` }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Image
          src={photo.public_id}
          alt={alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          placeholder="blur"
          blurDataURL={blurUrl(photo.public_id)}
          priority={isPriority}
          loading={isPriority ? 'eager' : 'lazy'}
          className={`object-cover protected-image transition-[transform,opacity] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045] ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          draggable={false}
          onLoad={() => setLoaded(true)}
        />

        {/* Hover scrim — neeche se uthta hua, caption ke liye */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        {/* Corner "view" affordance — desktop par hi */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-3 hidden h-8 w-8 translate-y-1 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white opacity-0 backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 md:flex"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </span>

        {photo.title && (
          <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-3 text-left opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 md:p-4">
            <span className="block truncate font-body text-[11px] uppercase tracking-[0.18em] text-white/95 md:text-xs">
              {photo.title}
            </span>
          </figcaption>
        )}
      </button>
    </figure>
  );
}
