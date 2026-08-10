'use client';

import { cn } from '@/lib/utils';

interface AnimatedTextProps {
  text: string;
  className?: string;
  variant?: 'word' | 'letter' | 'blur';
  delay?: number;
  as?: React.ElementType;
}

export default function AnimatedText({
  text,
  className = '',
  variant = 'word',
  delay = 0,
  as: Component = 'h2',
}: AnimatedTextProps) {
  const words = text.split(' ');

  if (variant === 'blur') {
    return (
      <Component className={cn('inline-block', className)}>
        <span
          className="reveal inline-block"
        >
          {text}
        </span>
      </Component>
    );
  }

  // Word-by-word reveal
  return (
    <Component className={cn('flex flex-wrap gap-[0.25em] items-center', className)}>
      {words.map((word, index) => (
        <span
          key={index}
          style={{ transitionDelay: `${delay + index * 0.08}s` }}
          className="reveal inline-block"
        >
          {word}
        </span>
      ))}
    </Component>
  );
}
