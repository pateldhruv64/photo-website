'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ShimmerButtonProps extends React.ComponentPropsWithoutRef<typeof motion.button> {
  children: React.ReactNode;
  className?: string;
  href?: string;
}

export default function ShimmerButton({
  children,
  className = '',
  href,
  onClick,
  ...props
}: ShimmerButtonProps) {
  const content = (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'group relative isolate flex items-center justify-center overflow-hidden rounded-full border border-white/20 bg-[#1E1410] px-6 py-3 text-sm font-medium text-white shadow-xl transition-all duration-300 hover:border-white/40 hover:shadow-2xl',
        className
      )}
      {...props}
    >
      {/* Sparkle / Shimmer Sweep Line */}
      <div
        className="pointer-events-none absolute -inset-full top-0 block h-full w-[200%] -rotate-45 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-marquee"
      />

      {/* Button Content */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );

  if (href) {
    return (
      <a href={href} className="inline-block">
        {content}
      </a>
    );
  }

  return content;
}
