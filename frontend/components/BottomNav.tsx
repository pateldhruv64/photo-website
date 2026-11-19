'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useSiteConfig } from '@/lib/hooks';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';

const ICON = {
  home: (
    <>
      <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20V9.5z" />
      <path d="M9 21v-7a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v7" />
    </>
  ),
  gallery: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
      <circle cx="8.5" cy="8.5" r="1.4" />
      <polyline points="21 15 16 10 5 21" />
    </>
  ),
  pricing: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.3" />
    </>
  ),
  reviews: (
    <polygon points="12 2.5 14.9 8.4 21.4 9.3 16.7 13.9 17.8 20.3 12 17.3 6.2 20.3 7.3 13.9 2.6 9.3 9.1 8.4 12 2.5" />
  ),
};

const SECTIONS = [
  { key: 'home', label: 'Home', icon: ICON.home, id: null },
  { key: 'gallery', label: 'Work', icon: ICON.gallery, id: 'gallery-section' },
  { key: 'pricing', label: 'Pricing', icon: ICON.pricing, id: 'pricing-section' },
  { key: 'reviews', label: 'Reviews', icon: ICON.reviews, id: 'testimonials-section' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const [active, setActive] = useState<string>('home');
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Apple Liquid Glass Sliding Pill state (inside the dock)
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({ left: 4, width: 56 });
  const [isDraggingPill, setIsDraggingPill] = useState(false);
  const [dragPillLeft, setDragPillLeft] = useState(0);
  const [dragStretch, setDragStretch] = useState(1);

  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const isInteracting = useRef(false);
  const dragStartX = useRef(0);
  const didDragRef = useRef(false);

  const config = useSiteConfig();
  const whatsappUrl = getWhatsAppUrl(config);
  const isHome = pathname === '/';

  // Measure and align the liquid glass pill to the currently active tab
  const updatePillToActive = useCallback(() => {
    if (!trackRef.current) return;
    const currentKey = active || 'home';
    const index = SECTIONS.findIndex((s) => s.key === currentKey);
    const targetEl = itemRefs.current[index >= 0 ? index : 0];
    if (targetEl && trackRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      setPillStyle({
        left: targetRect.left - trackRect.left,
        width: targetRect.width,
      });
    }
  }, [active]);

  // Active section scroll spy
  useEffect(() => {
    if (!isHome) {
      setActive('');
      return;
    }

    let offsets: Array<{ key: string; top: number }> = [];
    let frame = 0;

    const measure = () => {
      offsets = SECTIONS.filter((s) => s.id)
        .map((s) => {
          const el = document.getElementById(s.id as string);
          if (!el) return null;
          return { key: s.key, top: el.getBoundingClientRect().top + window.scrollY };
        })
        .filter(Boolean) as Array<{ key: string; top: number }>;
      offsets.sort((a, b) => a.top - b.top);
      updatePillToActive();
    };

    const update = () => {
      frame = 0;
      if (!offsets.length || isInteracting.current) return;

      const probe = window.scrollY + window.innerHeight / 2;
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) {
        setActive('reviews');
        return;
      }

      let current = 'home';
      for (const o of offsets) {
        if (probe >= o.top) current = o.key;
        else break;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    measure();
    update();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });

    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(document.body);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isHome, pathname, updatePillToActive]);

  useEffect(() => {
    if (!isDraggingPill) {
      updatePillToActive();
    }
  }, [active, isDraggingPill, updatePillToActive]);

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/client')) return null;

  // ─── Apple Segmented Liquid Glass: Drag-and-Slide Left/Right Gesture ───
  const onPointerDown = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isInteracting.current = true;
    didDragRef.current = false;
    dragStartX.current = e.clientX;

    const trackRect = trackRef.current.getBoundingClientRect();
    const fingerX = e.clientX - trackRect.left;

    setIsDraggingPill(true);
    setDragPillLeft(Math.max(0, Math.min(trackRect.width - pillStyle.width, fingerX - pillStyle.width / 2)));
    setDragStretch(1);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isInteracting.current || !trackRef.current) return;

    const rawDelta = e.clientX - dragStartX.current;
    if (Math.abs(rawDelta) > 5) {
      didDragRef.current = true;
    }

    const trackRect = trackRef.current.getBoundingClientRect();
    const fingerX = e.clientX - trackRect.left;

    // Fluid drag clamp
    const maxLeft = trackRect.width - pillStyle.width;
    const clampedLeft = Math.max(0, Math.min(maxLeft, fingerX - pillStyle.width / 2));

    // Liquid elongation stretch in drag direction
    const stretchFactor = Math.min(1.18, 1 + Math.abs(rawDelta) * 0.0018);

    setDragPillLeft(clampedLeft);
    setDragStretch(stretchFactor);

    // Find nearest tab under finger and highlight
    let closestIndex = 0;
    let minDistance = Infinity;

    itemRefs.current.forEach((el, idx) => {
      if (!el) return;
      const itemRect = el.getBoundingClientRect();
      const itemCenter = itemRect.left - trackRect.left + itemRect.width / 2;
      const dist = Math.abs(fingerX - itemCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    if (SECTIONS[closestIndex]) {
      setHoveredKey(SECTIONS[closestIndex].key);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isInteracting.current || !trackRef.current) return;
    isInteracting.current = false;
    setIsDraggingPill(false);
    setDragStretch(1);
    setHoveredKey(null);

    const trackRect = trackRef.current.getBoundingClientRect();
    const releaseFingerX = e.clientX - trackRect.left;

    // Find closest tab to release point
    let closestIndex = 0;
    let minDistance = Infinity;

    itemRefs.current.forEach((el, idx) => {
      if (!el) return;
      const itemRect = el.getBoundingClientRect();
      const itemCenter = itemRect.left - trackRect.left + itemRect.width / 2;
      const dist = Math.abs(releaseFingerX - itemCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    const targetSection = SECTIONS[closestIndex];
    if (targetSection) {
      setActive(targetSection.key);
      if (targetSection.key === 'home') {
        if (isHome) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.location.href = '/';
        }
      } else if (targetSection.id) {
        if (isHome) {
          document.getElementById(targetSection.id)?.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.location.href = `/#${targetSection.id}`;
        }
      }
    }
  };

  const handleTabClick = (key: string, id: string | null) => {
    if (didDragRef.current) return;
    setActive(key);
    if (key === 'home') {
      if (isHome) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.location.href = '/';
      }
    } else if (id) {
      if (isHome) {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = `/#${id}`;
      }
    }
  };

  const currentDisplayKey = hoveredKey || active;

  return (
    <nav
      id="bottom-nav"
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.85rem)] md:hidden select-none pointer-events-none"
    >
      {/* ─── Apple Liquid Glass Floating Dock (Remains Grounded At Bottom) ─── */}
      <div
        className="pointer-events-auto relative flex items-center gap-1.5 rounded-full p-1.5 shadow-[0_16px_44px_-10px_rgba(5,14,24,0.65)]"
      >
        {/* Layer 1: True Crystal Optical Glass (Reduced Blur 12px + 35% High Translucency) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-[#08121D]/35 backdrop-blur-[12px] backdrop-saturate-[180%] backdrop-brightness-[108%]"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.32)',
            boxShadow:
              'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.65), inset 0 -1.5px 1.5px 0 rgba(0, 0, 0, 0.35), 0 16px 40px -8px rgba(0, 0, 0, 0.45)',
          }}
        />

        {/* Layer 2: Interactive Segmented Control Track (Slide & Drag Left/Right Inside) */}
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative z-10 flex items-center gap-1 cursor-pointer touch-none"
        >
          {/* ─── Apple Liquid Glass Active Pill / Knob (Pure Crystal Glass) ─── */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0.5 bottom-0.5 rounded-full bg-white/[0.24] border border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.25),inset_0_1.5px_2px_0_rgba(255,255,255,0.75),inset_0_-1px_1px_0_rgba(0,0,0,0.25)] backdrop-blur-[8px] will-change-transform"
            style={{
              left: `${isDraggingPill ? dragPillLeft : pillStyle.left}px`,
              width: `${pillStyle.width}px`,
              transform: `scaleX(${isDraggingPill ? dragStretch : 1})`,
              transition: isDraggingPill
                ? 'none'
                : 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1), width 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s ease',
            }}
          />

          {/* Nav Item Buttons */}
          {SECTIONS.map((item, idx) => {
            const isSelected = currentDisplayKey === item.key;

            return (
              <button
                key={item.key}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                type="button"
                onClick={() => handleTabClick(item.key, item.id)}
                className={`relative flex h-12 min-w-[3.35rem] flex-col items-center justify-center gap-[3px] rounded-full px-3 transition-colors duration-200 active:scale-95 ${
                  isSelected
                    ? 'text-white font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]'
                    : 'text-white/80 hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]'
                }`}
              >
                <span className="relative z-10">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill={isSelected ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={isSelected ? '2.2' : '1.8'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {item.icon}
                  </svg>
                </span>
                <span className="relative z-10 text-[9px] tracking-[0.06em]">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Separator Line (Conforming to Apple Toolbar fixed spacer HIG) */}
        <div aria-hidden="true" className="relative z-10 h-7 w-px bg-white/25" />

        {/* WhatsApp CTA Pill */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="relative z-10 flex h-12 min-w-[3.35rem] flex-col items-center justify-center gap-[3px] rounded-full bg-[#25D366] px-3.5 text-white shadow-[0_4px_16px_rgba(37,211,102,0.45),inset_0_1.5px_1.5px_rgba(255,255,255,0.6)] transition-all duration-300 hover:brightness-110 active:scale-90"
          >
            <WhatsAppIcon size={19} />
            <span className="text-[9px] font-semibold tracking-[0.06em]">Chat</span>
          </a>
        )}
      </div>
    </nav>
  );
}
