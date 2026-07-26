'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FlipWordsProps {
  words: string[];
  duration?: number;
  className?: string;
}

export default function FlipWords({
  words,
  duration = 3000,
  className = '',
}: FlipWordsProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = useCallback(() => {
    const nextIndex = (currentWordIndex + 1) % words.length;
    setCurrentWordIndex(nextIndex);
    setIsAnimating(true);
  }, [currentWordIndex, words.length]);

  useEffect(() => {
    if (!isAnimating) {
      const timer = setTimeout(() => {
        startAnimation();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, duration, startAnimation]);

  const currentWord = words[currentWordIndex];

  return (
    <AnimatePresence
      onExitComplete={() => {
        setIsAnimating(false);
      }}
    >
      <motion.div
        key={currentWord}
        initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{
          opacity: 0,
          y: -10,
          filter: 'blur(8px)',
          scale: 2,
          position: 'absolute',
        }}
        transition={{
          type: 'spring',
          stiffness: 250,
          damping: 25,
          duration: 0.5,
        }}
        className={cn('inline-block relative text-left text-amber-300 font-normal', className)}
      >
        {currentWord.split(' ').map((word, wordIndex) => (
          <span key={word + wordIndex} className="inline-block whitespace-nowrap">
            {word.split('').map((letter, letterIndex) => (
              <motion.span
                key={word + letterIndex}
                initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  delay: wordIndex * 0.1 + letterIndex * 0.03,
                  duration: 0.25,
                }}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
            <span className="inline-block">&nbsp;</span>
          </span>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
