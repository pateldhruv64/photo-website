'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ShimmerButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  children: React.ReactNode;
  className?: string;
  href?: string;
}

/**
 * Pehle yeh framer-motion ka `motion.button` tha, sirf
 * `whileHover: scale 1.02` aur `whileTap: scale 0.98` ke liye.
 * Wo do lines poori animation library ko bundle me le aati thi.
 * CSS ka `hover:scale-[1.02] active:scale-[0.98]` bilkul wahi karta hai.
 */
export default function ShimmerButton({
  children,
  className = '',
  href,
  onClick,
  ...props
}: ShimmerButtonProps) {
  const content = (
    <button
      onClick={onClick}
      className={cn(
        'group relative isolate flex items-center justify-center overflow-hidden rounded-full border border-white/20 bg-ink px-6 py-3 text-sm font-medium text-white shadow-xl',
        'transition-transform duration-300 ease-editorial hover:scale-[1.02] active:scale-[0.98]',
        'hover:border-white/40',
        className
      )}
      {...props}
    >
      {/* Shimmer sweep — hover par ek baar guzarta hai */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-[900ms] ease-editorial group-hover:translate-x-full"
      />

      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
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
