'use client';

import useSWR from 'swr';
import Image from 'next/image';
import { fetcher } from '@/lib/fetcher';
import { useSiteConfig } from '@/lib/hooks';
import { blurUrl } from '@/lib/cloudinary';
import type { Photo } from '@/lib/types';

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

interface InstagramFeedProps {
  /* Homepage apni pehli 24 photos pehle hi server par le aata hai —
     yeh strip unhi me se pehli 6 dikhata hai. Prop mile to koi request
     nahi jaati; sirf tab fetch hota hai jab yeh component kisi aise
     page par ho jahan photos pehle se maujood na hon. */
  photos?: Photo[];
}

export default function InstagramFeed({ photos }: InstagramFeedProps = {}) {
  const { data: photosData } = useSWR<PhotosResponse>(
    photos ? null : '/photos?limit=6',
    fetcher,
    { revalidateIfStale: false, revalidateOnFocus: false },
  );

  const config = useSiteConfig();

  const instagramUrl = config?.social_links?.instagram || '#';
  const feedPhotos = (photos ?? photosData?.photos ?? []).slice(0, 6);

  if (feedPhotos.length === 0) return null;

  const handle =
    config?.photographer_name?.toLowerCase().replace(/\s+/g, '') ||
    'niksphotos';
  const logo = config?.studio_logo?.secure_url;

  /* Bento sirf tab jab poori 6 photos hain: pehli photo 2x2 badi, baaki 5
     chhoti — milkar perfect 3x3. Kam photos hon to seedhi barabar grid,
     warna bade tile ke aas-paas khaali jagah reh jaati. */
  const bento = feedPhotos.length === 6;

  return (
    <section className="relative overflow-hidden bg-surface py-14 md:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* ── Profile header: Instagram profile jaisa, centered heading ki jagah ── */}
        <div className="mb-5 flex items-center justify-between gap-4 md:mb-8">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-w-0 items-center gap-3.5"
          >
            {/* Instagram-gradient ring — section ki ek hi "yaad rehne wali" cheez */}
            <span className="flex-shrink-0 rounded-full bg-gradient-to-tr from-[#F77737] via-[#FD1D1D] to-[#833AB4] p-[2.5px]">
              <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-surface md:h-14 md:w-14">
                {logo ? (
                  <Image
                    src={logo}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="font-display text-xl font-light text-text-primary">
                    {handle.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
            </span>

            <span className="min-w-0">
              <span className="block truncate font-display text-2xl font-light leading-none text-text-primary transition-opacity group-hover:opacity-70 md:text-4xl">
                @{handle}
              </span>
              <span className="mt-1.5 block font-body text-xs text-text-muted md:text-sm">
                Latest work on Instagram
              </span>
            </span>
          </a>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-text-primary px-5 py-2.5 font-body text-sm font-medium text-surface transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.96]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            Follow
          </a>
        </div>

        {/* ── Mosaic: tight gaps + ek hi bahari rounded corner (Instagram profile grid jaisa) ── */}
        <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-2xl sm:gap-1.5 md:gap-2">
          {feedPhotos.map((photo, idx) => (
            <FeedTile
              key={photo._id}
              photo={photo}
              index={idx}
              href={instagramUrl}
              big={bento && idx === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeedTile({
  photo,
  index,
  href,
  big,
}: {
  photo: Photo;
  index: number;
  href: string;
  big: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        photo.title ? `${photo.title} — view on Instagram` : 'View on Instagram'
      }
      style={{ transitionDelay: `${index * 0.08}s` }}
      className={`reveal-scale group relative block overflow-hidden bg-line/40 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
        big ? 'col-span-2 row-span-2' : 'aspect-square'
      }`}
    >
      <Image
        src={photo.public_id}
        alt={photo.title || 'Photo'}
        fill
        sizes={
          big
            ? '(max-width: 896px) 66vw, 600px'
            : '(max-width: 896px) 33vw, 300px'
        }
        placeholder="blur"
        blurDataURL={blurUrl(photo.public_id)}
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Hover par halka dark + Instagram icon (touch screen par kuch nahi dikhta) */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
        <svg
          width={big ? 32 : 24}
          height={big ? 32 : 24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      </div>
    </a>
  );
}
