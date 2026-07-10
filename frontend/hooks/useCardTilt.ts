'use client';
import { useEffect, RefObject } from 'react';

export function useCardTilt(containerRef: RefObject<HTMLElement>, intensity = 8) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia('(hover: none)').matches) return; // skip on touch

    const cards = container.querySelectorAll<HTMLElement>('[data-tilt]');

    const handleMove = (card: HTMLElement) => (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale(1.02)`;
    };

    const handleLeave = (card: HTMLElement) => () => {
      card.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)';
      card.style.transition = 'transform 0.5s ease';
    };

    const handleEnter = (card: HTMLElement) => () => {
      card.style.transition = 'transform 0.1s linear';
    };

    const listeners: Array<() => void> = [];

    cards.forEach((card) => {
      const move = handleMove(card);
      const leave = handleLeave(card);
      const enter = handleEnter(card);
      card.addEventListener('mousemove', move);
      card.addEventListener('mouseleave', leave);
      card.addEventListener('mouseenter', enter);
      card.style.willChange = 'transform';
      listeners.push(() => {
        card.removeEventListener('mousemove', move);
        card.removeEventListener('mouseleave', leave);
        card.removeEventListener('mouseenter', enter);
      });
    });

    return () => listeners.forEach(fn => fn());
  }, [containerRef, intensity]);
}
