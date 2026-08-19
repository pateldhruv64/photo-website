'use client';

import Image from 'next/image';
import { memo } from 'react';
import { blurUrl } from '@/lib/cloudinary';
import { CheckIcon, DownloadIcon, HeartIcon } from '@/components/client/icons';

export interface TilePhoto {
  _id: string;
  public_id: string;
  width: number;
  height: number;
  title: string;
}

interface PhotoTileProps {
  photo: TilePhoto;
  /** Gallery me iska number (1-based) — filename se match karta hai. */
  position: number;
  index: number;
  selectMode: boolean;
  selected: boolean;
  favorite: boolean;
  downloading: boolean;
  onOpen: () => void;
  onToggleSelect: () => void;
  onToggleFavorite: () => void;
  onDownload: () => void;
}

const ActionButton = ({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 ease-editorial active:scale-90 ${
      active
        ? 'border-transparent bg-white text-red-500'
        : 'border-white/25 bg-black/35 text-white/85 hover:bg-black/60 hover:text-white'
    }`}
  >
    {children}
  </button>
);

/**
 * Ek photo ka card.
 *
 * Select mode on ho to poora card ek toggle ban jaata hai — clients
 * aksar mobile par 40-50 photos chunte hain, aur chhote checkbox par
 * theek nishana lagana takleef deta hai.
 */
function PhotoTile({
  photo,
  position,
  index,
  selectMode,
  selected,
  favorite,
  downloading,
  onOpen,
  onToggleSelect,
  onToggleFavorite,
  onDownload,
}: PhotoTileProps) {
  return (
    <div
      className="cg-tile mb-1.5 break-inside-avoid md:mb-5"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      <div
        className="cg-tile-frame group"
        data-selected={selected}
        style={{ aspectRatio: `${photo.width}/${photo.height}` }}
        onClick={selectMode ? onToggleSelect : onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            (selectMode ? onToggleSelect : onOpen)();
          }
        }}
        role={selectMode ? 'checkbox' : 'button'}
        aria-checked={selectMode ? selected : undefined}
        aria-label={photo.title || `Photo ${position}`}
        tabIndex={0}
      >
        <Image
          src={photo.public_id}
          alt={photo.title || `Photo ${position}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          placeholder="blur"
          blurDataURL={blurUrl(photo.public_id)}
          className="object-cover"
          draggable={false}
        />

        <div className="cg-tile-veil pointer-events-none" />

        {/* Select mode: ek bada, saaf checkmark */}
        {selectMode && (
          <span
            className={`absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300 ease-editorial ${
              selected
                ? 'border-white bg-accent-deep text-white'
                : 'border-white/70 bg-black/25 text-transparent'
            }`}
          >
            <CheckIcon size={14} />
          </span>
        )}

        {/* Photo ka number — client jab kehta hai "photo 42 retouch karo"
            to dono ke paas ek hi reference hota hai. Yahi number
            filename me bhi jaata hai. */}
        {!selectMode && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-black/45 px-2 py-0.5 font-body text-[10px] tabular-nums text-white/90 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            {position}
          </span>
        )}

        {/* Favourite — select mode me bhi kaam karta hai */}
        <div className="absolute right-2.5 top-2.5 z-10">
          <ActionButton
            label={favorite ? 'Remove from favourites' : 'Mark as favourite'}
            active={favorite}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <HeartIcon size={14} filled={favorite} />
          </ActionButton>
        </div>

        {!selectMode && (
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <ActionButton
              label="Download this photo"
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
            >
              {downloading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <DownloadIcon size={14} />
              )}
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(PhotoTile);
