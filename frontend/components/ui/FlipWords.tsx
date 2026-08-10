'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FlipWordsProps {
  words: string[];
  duration?: number;
  className?: string;
}

/**
 * Rotating word effect — ab pure CSS animation se.
 *
 * Pehle yeh framer-motion ke AnimatePresence + per-LETTER motion.span
 * se banta tha. Ek 8-letter word ka matlab tha 8 alag animated
 * components, har ek apne spring physics ke saath, hamesha chalte
 * rehte. Ek chhote se decorative effect ke liye kaafi mehnga tha.
 *
 * Ab: ek element, ek CSS keyframe. Dikhne me lagbhag same, cost ~0.
 */
export default function FlipWords({ words, duration = 3000, className = '' }: FlipWordsProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, duration);
    return () => clearInterval(timer);
  }, [words.length, duration]);

  const word = words[index];

  return (
    <span
      className={cn('relative inline-block text-left font-normal text-accent-soft', className)}
      // `key` badalne par element remount hota hai, jisse CSS animation
      // har naye word par dobara chalti hai.
      key={word}
      style={{ animation: 'flip-word 0.55s cubic-bezier(0.16,1,0.3,1) both' }}
    >
      {word}
    </span>
  );
}
