'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glareOpacity?: number;
  spotlightColor?: string;
  onClick?: () => void;
}

export default function TiltCard({
  children,
  className = '',
  maxTilt = 10,
  glareOpacity = 0.25,
  spotlightColor = 'rgba(255, 255, 255, 0.15)',
  onClick,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse relative coordinates (-1 to 1)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for rotation
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]), {
    stiffness: 300,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]), {
    stiffness: 300,
    damping: 25,
  });

  // Spotlight position %
  const spotlightX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), {
    stiffness: 300,
    damping: 25,
  });
  const spotlightY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), {
    stiffness: 300,
    damping: 25,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const x = (e.clientX - rect.left) / width - 0.5;
    const y = (e.clientY - rect.top) / height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      transition={{ duration: 0.2 }}
      className={cn('relative rounded-xl transition-shadow duration-300 group cursor-pointer overflow-hidden', className)}
    >
      {/* 3D Content Container */}
      <div className="relative z-10 w-full h-full">{children}</div>

      {/* Inspira UI Radial Spotlight Overlay */}
      {isHovered && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 rounded-xl transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${spotlightX.get()}% ${spotlightY.get()}%, ${spotlightColor}, transparent 80%)`,
          }}
        />
      )}

      {/* Glare Sheen Effect */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 z-30 rounded-xl transition-opacity duration-300"
          style={{
            opacity: glareOpacity,
            background: `linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%)`,
          }}
        />
      )}
    </motion.div>
  );
}
