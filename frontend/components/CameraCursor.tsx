'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function CameraCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [clicked, setClicked] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let hideTimeout: NodeJS.Timeout;
    let isMobile = window.matchMedia('(pointer: coarse)').matches;

    const mql = window.matchMedia('(pointer: coarse)');
    const handleMql = (e: MediaQueryListEvent) => {
      isMobile = e.matches;
      setIsVisible(!isMobile);
    };
    mql.addEventListener('change', handleMql);
    
    if (!isMobile) {
      setIsVisible(true);
    }

    const onPointerMove = (e: PointerEvent) => {
      if (isMobile || !cursorRef.current) return;
      cursorRef.current.style.transform = `translate(${e.clientX + 24}px, ${e.clientY + 12}px)`;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!cursorRef.current) return;
      
      if (isMobile) {
        cursorRef.current.style.transform = `translate(${e.clientX - 9}px, ${e.clientY - 30}px)`;
        setIsVisible(true);
        setClicked(true);
        
        clearTimeout(hideTimeout);
        setTimeout(() => setClicked(false), 150);
        hideTimeout = setTimeout(() => setIsVisible(false), 1000);
      } else {
        setClicked(true);
        setTimeout(() => setClicked(false), 150);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      if (isMobile) return;
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'a' || target.tagName.toLowerCase() === 'button' || target.closest('a') || target.closest('button')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('mouseover', handleMouseOver);
      mql.removeEventListener('change', handleMql);
      clearTimeout(hideTimeout);
    };
  }, [pathname]);

  return (
    <div 
      ref={cursorRef}
      className={`pointer-events-none fixed top-0 left-0 z-[9999] flex items-center justify-center text-[#1E1410] drop-shadow-md transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ willChange: 'transform' }}
    >
      <div className="relative">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" height="18" 
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-300 ${isHovering ? 'rotate-12 scale-110' : 'rotate-0 scale-100'}`}
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        
        {/* Camera Flash Element (Mini flash from the camera itself) */}
        <div 
          className={`absolute -top-1 right-0 w-2.5 h-2.5 bg-white rounded-full blur-[1px] transition-all duration-75 ${clicked ? 'opacity-100 scale-150' : 'opacity-0 scale-50'}`} 
          style={{ boxShadow: '0 0 12px 6px rgba(255, 255, 255, 0.9)' }}
        />
      </div>
    </div>
  );
}
