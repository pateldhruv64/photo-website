'use client';

import { motion } from 'framer-motion';
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
        <motion.span
          initial={{ opacity: 0, filter: 'blur(12px)', y: 15 }}
          whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, delay, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="inline-block"
        >
          {text}
        </motion.span>
      </Component>
    );
  }

  // Word-by-word reveal
  return (
    <Component className={cn('flex flex-wrap gap-[0.25em] items-center', className)}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{
            duration: 0.6,
            delay: delay + index * 0.08,
            ease: [0.215, 0.61, 0.355, 1],
          }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </Component>
  );
}
