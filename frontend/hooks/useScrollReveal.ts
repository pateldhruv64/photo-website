'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useScrollReveal(selector = '.reveal, .reveal-left, .reveal-scale, .divider-line') {
  const pathname = usePathname();

  useEffect(() => {
    let observer: IntersectionObserver;
    
    const initObserver = () => {
      const elements = document.querySelectorAll(selector);
      if (!elements.length) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              // Animation complete hone ke baad GPU memory free karo
              setTimeout(() => {
                (entry.target as HTMLElement).style.willChange = 'auto';
              }, 800);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
      
      elements.forEach((el) => {
        if (!el.classList.contains('visible')) {
          observer.observe(el);
        }
      });
    };

    const timeout = setTimeout(initObserver, 100);

    const mutationObserver = new MutationObserver(() => {
      if (observer) observer.disconnect();
      initObserver();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timeout);
      if (observer) observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [selector, pathname]);
}
