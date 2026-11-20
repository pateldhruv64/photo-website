'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { blurUrl } from '@/lib/cloudinary';
import type { Photo } from '@/lib/types';

interface MarqueeProps {
  photos: Photo[];
  reverse?: boolean;
  speed?: number;
}

/** Hover par normal speed ka kitna hissa chale (0.35 = 35% speed → slow-motion).
 *  Aur slow chahiye to 0.25, thoda tez chahiye to 0.5. */
const HOVER_RATE = 0.30;
/** Speed badalne ka smoothing time (ms). Bada = zyada dheere ramp. */
const RAMP_MS = 350;

export default function Marquee({
  photos,
  reverse = false,
  speed = 30,
}: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const targetRate = useRef(1);
  const currentRate = useRef(1);
  const rafId = useRef(0);
  const lastTime = useRef(0);

  /**
   * CSS animation ko pause/stop nahi karte — uski playbackRate smoothly
   * 1 ↔ HOVER_RATE karte hain. Is se:
   *   - marquee kabhi rukta nahi, bas slow-motion me chalta hai
   *   - speed me jhatka nahi aata (position wahin se aage badhti hai)
   *   - CSS keyframes ya animation-duration badalne ki zarurat nahi
   */
  const tick = useCallback((now: number) => {
    const dt = lastTime.current ? now - lastTime.current : 16;
    lastTime.current = now;

    // frame-rate independent easing
    const k = 1 - Math.exp(-dt / (RAMP_MS / 3));
    const diff = targetRate.current - currentRate.current;
    currentRate.current =
      Math.abs(diff) < 0.002
        ? targetRate.current
        : currentRate.current + diff * k;

    const el = trackRef.current;
    if (el && typeof el.getAnimations === 'function') {
      for (const anim of el.getAnimations()) {
        anim.playbackRate = currentRate.current;
      }
    }

    if (currentRate.current !== targetRate.current) {
      rafId.current = requestAnimationFrame(tick);
    } else {
      rafId.current = 0;
      lastTime.current = 0;
    }
  }, []);

  const setTarget = useCallback(
    (rate: number) => {
      targetRate.current = rate;
      if (!rafId.current) {
        lastTime.current = 0;
        rafId.current = requestAnimationFrame(tick);
      }
    },
    [tick],
  );

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  if (!photos || photos.length === 0) return null;

  // Ensure we have enough items to fill screen width and loop seamlessly.
  // We repeat the array an even number of times so that shifting by 50% is a perfect loop.
  const repeatCount = Math.max(4, Math.ceil(12 / photos.length));
  const evenRepeatCount = repeatCount % 2 === 0 ? repeatCount : repeatCount + 1;
  const duplicated = Array(evenRepeatCount).fill(photos).flat();

  return (
    <div
      className="marquee-container overflow-hidden group"
      // Pointer events mouse + touch dono cover karte hain. Sirf isi line ka
      // marquee slow hoga, doosri line apni normal speed par chalti rahegi.
      onPointerEnter={() => setTarget(HOVER_RATE)}
      onPointerLeave={() => setTarget(1)}
      onPointerCancel={() => setTarget(1)}
    >
      <div
        ref={trackRef}
        className={reverse ? 'marquee-content-reverse' : 'marquee-content'}
        // animationPlayState 'running' inline rakha hai taaki CSS me koi
        // `:hover { animation-play-state: paused }` ho to bhi marquee na ruke.
        style={{
          animationDuration: `${speed}s`,
          animationPlayState: 'running',
        }}
      >
        {duplicated.map((photo, i) => (
          <div
            key={`${photo._id}-${i}`}
            className="marquee-item flex-shrink-0 rounded-sm overflow-hidden"
            style={
              {
                ['--aspect-ratio']: photo.width / photo.height,
              } as React.CSSProperties
            }
          >
            <Image
              src={photo.public_id}
              alt={photo.title || 'Photo'}
              fill
              sizes="(max-width: 768px) 180px, 300px"
              placeholder="blur"
              blurDataURL={blurUrl(photo.public_id)}
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
