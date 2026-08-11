'use client';

import { useCallback, useRef } from 'react';

/**
 * ─────────────────────────────────────────────────────────────────────
 *  LIGHTBOX TOUCH GESTURES
 * ─────────────────────────────────────────────────────────────────────
 *  Do gestures, jaise har photo viewer me hote hain:
 *
 *    • bagal me swipe  → pichli / agli photo
 *    • neeche swipe    → band
 *
 *  Neeche wala pehle kahin nahi tha — mobile par band karne ka ek hi
 *  tarika tha, kone me chhota sa X. Instagram, Google Photos, Apple
 *  Photos sab me swipe-down chalta hai, isliye log sabse pehle wahi
 *  try karte hain aur phatak se laga ki site atak gayi.
 *
 *  Drag ke dauraan photo ungli ke saath chalti hai, halki chhoti hoti
 *  hai aur background saaf hone lagta hai — user ko turant dikh jaata
 *  hai ki gesture pakda gaya aur wo aadhe raste se wapas bhi aa sakta
 *  hai.
 *
 *  Yeh styles seedhe DOM par likhi jaati hain, React state se nahi. Har
 *  touchmove par poora lightbox dobara render karna mobile par saaf
 *  jhatka deta hai. Sirf `transform` aur `opacity` chhoote hain — dono
 *  compositor par chalte hain, main thread par kuch nahi aata.
 *
 *  Dono lightbox (public gallery aur client gallery) yahi hook use
 *  karte hain, taki gesture har jagah bilkul ek jaisa lage.
 */

/** Neeche itna kheencha to band; isse kam par photo wapas jagah par. */
const DISMISS_AFTER = 110;
/** Itna hile to ise tap nahi, swipe maano. */
const MOVE_SLOP = 8;
/** Photo badalne ke liye zaroori horizontal doori. */
const SWIPE_DISTANCE = 50;

interface Options {
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function useLightboxGestures({ onClose, onNext, onPrev }: Options) {
  /** Jis element par photo hai — drag me yahi chalta hai. */
  const stageRef = useRef<HTMLDivElement>(null);
  /** Poora overlay — drag me iski opacity girti hai. */
  const overlayRef = useRef<HTMLDivElement>(null);

  const gesture = useRef({ startX: 0, startY: 0, dy: 0, dragging: false, moved: false });

  const paint = (dy: number) => {
    const dist = Math.max(0, dy);
    if (stageRef.current) {
      // Halka sa sikudna — jaise photo peeche ja rahi ho
      const scale = Math.max(0.88, 1 - dist / 1400);
      stageRef.current.style.transform = `translate3d(0, ${dist}px, 0) scale(${scale})`;
    }
    if (overlayRef.current) {
      overlayRef.current.style.opacity = `${Math.max(0.35, 1 - dist / 520)}`;
    }
  };

  const reset = (animate: boolean) => {
    for (const el of [stageRef.current, overlayRef.current]) {
      if (!el) continue;
      el.style.transition = animate
        ? 'transform 0.32s var(--ease), opacity 0.32s var(--ease)'
        : '';
    }
    if (stageRef.current) stageRef.current.style.transform = '';
    if (overlayRef.current) overlayRef.current.style.opacity = '';
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    gesture.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      dy: 0,
      dragging: false,
      moved: false,
    };
    reset(false);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const g = gesture.current;
    const dx = e.touches[0].clientX - g.startX;
    const dy = e.touches[0].clientY - g.startY;

    if (Math.abs(dx) > MOVE_SLOP || Math.abs(dy) > MOVE_SLOP) g.moved = true;

    /* Dismiss-drag sirf tab jab neeche ki taraf ho AUR horizontal se
       saaf zyada ho. Warna thodi si tirchhi swipe photo badalne ke
       bajaye lightbox hi band kar deti. */
    if (!g.dragging && dy > 12 && dy > Math.abs(dx) * 1.4) g.dragging = true;

    if (g.dragging) {
      g.dy = dy;
      paint(dy);
    }
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const g = gesture.current;
      const dx = e.changedTouches[0].clientX - g.startX;
      const dy = e.changedTouches[0].clientY - g.startY;

      if (g.dragging) {
        if (g.dy > DISMISS_AFTER) onClose();
        else reset(true);
        return;
      }

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_DISTANCE) {
        if (dx > 0) onPrev();
        else onNext();
      }
    },
    [onClose, onNext, onPrev]
  );

  /* Swipe ke baad browser ek click bhi bhejta hai. Bina iske overlay ka
     onClick chal jaata aur lightbox swipe-back ke turant baad band ho
     jaata. */
  const onOverlayClick = useCallback(() => {
    if (!gesture.current.moved) onClose();
  }, [onClose]);

  return { stageRef, overlayRef, onTouchStart, onTouchMove, onTouchEnd, onOverlayClick };
}
