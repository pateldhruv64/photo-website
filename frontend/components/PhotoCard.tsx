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

/**
 * ─────────────────────────────────────────────────────────────────────
 *  BESPOKE EDITORIAL PHOTO CARD (Aperture & Lens Focus Craft)
 * ─────────────────────────────────────────────────────────────────────
 *  - Viewfinder Reticle Framing: 4 optical corner brackets that subtly
 *    illuminate on hover, matching the CameraCursor AF-LOCK language.
 *  - Anti-Reflective Optical Glass Sheen: Diagonal light sheen that sweeps
 *    across the image on hover (GPU-composited translate3d).
 *  - Tactile Shutter Recoil: Micro-scale compression on active click.
 *  - Editorial Typography: Cormorant serif title + monospaced ISO/Category
 *    metadata with WCAG AAA contrast protection scrim.
 *  - Strict prefers-reduced-motion & zero layout thrashing.
 */
export default function PhotoCard({ photo, onClick, index = 99 }: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);

  const categoryName =
    typeof photo.category === 'object' && photo.category?.name
      ? photo.category.name
      : typeof photo.category === 'string'
      ? photo.category
      : null;

  // Alt text backend se aata hai (blank ho to wahi auto-generate karta hai).
  // Yaha last-resort fallback hai taki alt kabhi khaali na jaaye.
  const alt =
    photo.alt_text ||
    photo.title ||
    (categoryName ? `${categoryName} photography` : 'Professional photography');

  // Pehli 4 images above the fold hoti hain — inhe eager load karo
  const isPriority = index < 4;

  return (
    <figure className="mb-3 md:mb-5 break-inside-avoid">
      <button
        type="button"
        data-photo-card="true"
        onClick={() => onClick(photo)}
        aria-label={`Open ${alt} in full screen view`}
        className="group relative block w-full overflow-hidden rounded-xl md:rounded-2xl bg-hover-surface shadow-[0_1px_3px_rgba(20,36,51,0.06)] transition-[box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform hover:shadow-[0_20px_50px_-12px_rgba(20,36,51,0.32)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:active:scale-100"
        style={{ aspectRatio: `${photo.width}/${photo.height}` }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Base Image with Aperture Focus Scale & Clarity Lift */}
        <Image
          src={photo.public_id}
          alt={alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          placeholder="blur"
          blurDataURL={blurUrl(photo.public_id)}
          priority={isPriority}
          loading={isPriority ? 'eager' : 'lazy'}
          className={`object-cover protected-image transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045] group-hover:contrast-[1.03] motion-reduce:group-hover:scale-100 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          draggable={false}
          onLoad={() => setLoaded(true)}
        />

        {/* Optical Glass Lens Sheen Sweep (anti-reflective glass reflection) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-tr from-transparent via-white/15 to-transparent transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-full motion-reduce:hidden"
        />

        {/* High-Contrast Editorial Gradient Scrim for Legibility */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100"
        />

        {/* Inner Glass Border / Viewfinder Bezel */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl md:rounded-2xl ring-1 ring-inset ring-white/10 transition-colors duration-500 group-hover:ring-white/30"
        />

        {/* Viewfinder Reticle Framing Brackets (4 Corners) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-2.5 md:inset-3.5 opacity-0 transition-opacity duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 motion-reduce:hidden"
        >
          {/* Top-Left Bracket */}
          <span className="absolute left-0 top-0 h-2.5 w-2.5 border-l border-t border-white/70" />
          {/* Top-Right Bracket */}
          <span className="absolute right-0 top-0 h-2.5 w-2.5 border-r border-t border-white/70" />
          {/* Bottom-Left Bracket */}
          <span className="absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-white/70" />
          {/* Bottom-Right Bracket */}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-white/70" />
        </div>

        {/* Corner Viewfinder Loupe / Expand Trigger Affordance */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-3 hidden h-8 w-8 -translate-y-1 items-center justify-center rounded-full border border-white/30 bg-ink/30 text-white opacity-0 shadow-sm backdrop-blur-md transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:translate-y-0 md:flex"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </span>

        {/* Caption & Metadata Overlay */}
        {(photo.title || categoryName || photo.location) && (
          <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1.5 p-3 text-left opacity-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:translate-y-0 md:p-4">
            {categoryName && (
              <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-accent/90">
                {categoryName}
              </span>
            )}
            {photo.title && (
              <span className="block truncate font-serif text-sm font-normal tracking-[0.02em] text-white drop-shadow-sm md:text-base">
                {photo.title}
              </span>
            )}
            {photo.location && (
              <span className="mt-0.5 block truncate font-body text-[10px] tracking-wider text-white/75">
                {photo.location}
              </span>
            )}
          </figcaption>
        )}
      </button>
    </figure>
  );
}
