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

  // Water Droplet Physical Deformation state (Volume-Preserving Elastic Shear)
  const [waterDeform, setWaterDeform] = useState<{ scaleX: number; scaleY: number; skewX: number }>({
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
  });
  const [isWobbling, setIsWobbling] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const isInteracting = useRef(false);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const didDragRef = useRef(false);
  const wobbleTimer = useRef<NodeJS.Timeout | null>(null);

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

  // ─── Real Water Droplet Drag Physics (Volume Conservation & Elastic Shear) ───
  const onPointerDown = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isInteracting.current = true;
    didDragRef.current = false;
    lastX.current = e.clientX;
    lastTime.current = performance.now();

    if (wobbleTimer.current) clearTimeout(wobbleTimer.current);
    setIsWobbling(false);

    const trackRect = trackRef.current.getBoundingClientRect();
    const fingerX = e.clientX - trackRect.left;

    setIsDraggingPill(true);
    setDragPillLeft(Math.max(0, Math.min(trackRect.width - pillStyle.width, fingerX - pillStyle.width / 2)));
    setWaterDeform({ scaleX: 1.05, scaleY: 0.95, skewX: 0 });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isInteracting.current || !trackRef.current) return;

    const now = performance.now();
    const dt = Math.max(1, now - lastTime.current);
    const dx = e.clientX - lastX.current;

    // Instantaneous horizontal velocity in px/ms
    const vx = dx / dt;

    if (Math.abs(dx) > 3) {
      didDragRef.current = true;
    }

    lastX.current = e.clientX;
    lastTime.current = now;

    const trackRect = trackRef.current.getBoundingClientRect();
    const fingerX = e.clientX - trackRect.left;

    // Fluid drag clamp
    const maxLeft = trackRect.width - pillStyle.width;
    const clampedLeft = Math.max(0, Math.min(maxLeft, fingerX - pillStyle.width / 2));

    // ─── Physical Water Droplet Deformation Equation ───
    // Elongates horizontally with speed; compresses vertically to conserve fluid volume
    const speed = Math.min(3.5, Math.abs(vx) * 2.2);
    const scaleX = 1 + speed * 0.12;
    const scaleY = 1 / Math.sqrt(scaleX); // Exact conservation of volume
    const skewX = Math.max(-10, Math.min(10, -vx * 8)); // Fluid viscous drag tilt

    setDragPillLeft(clampedLeft);
    setWaterDeform({ scaleX, scaleY, skewX });

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
    setHoveredKey(null);

    // Trigger organic water droplet wobble settle
    setIsWobbling(true);
    setWaterDeform({ scaleX: 1, scaleY: 1, skewX: 0 });

    if (wobbleTimer.current) clearTimeout(wobbleTimer.current);
    wobbleTimer.current = setTimeout(() => {
      setIsWobbling(false);
    }, 450);

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
    setIsWobbling(true);
    if (wobbleTimer.current) clearTimeout(wobbleTimer.current);
    wobbleTimer.current = setTimeout(() => setIsWobbling(false), 450);

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
      {/* ─── Apple Pure Liquid Glass Dock (Low Blur 4px + Pure Crystal Translucency) ─── */}
      <div
        className="pointer-events-auto relative flex items-center gap-1.5 rounded-full p-1.5 shadow-[0_16px_40px_-8px_rgba(15,25,35,0.3)]"
      >
        {/* Layer 1: Pure Transparent Optical Glass (Minimal 4px Blur + High Clarity Tint) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-white/[0.14] backdrop-blur-[4px] backdrop-saturate-[180%] backdrop-contrast-[105%]"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.55)',
            boxShadow:
              'inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.85), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.12), 0 8px 32px rgba(10, 20, 30, 0.18)',
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
          {/* ─── Water Droplet Liquid Knob (Pure Liquid Fluidity & Wobble) ─── */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute top-0.5 bottom-0.5 rounded-full will-change-transform ${
              isWobbling ? 'animate-water-wobble' : ''
            }`}
            style={{
              left: `${isDraggingPill ? dragPillLeft : pillStyle.left}px`,
              width: `${pillStyle.width}px`,
              transform: isDraggingPill
                ? `scale(${waterDeform.scaleX}, ${waterDeform.scaleY}) skewX(${waterDeform.skewX}deg)`
                : 'scale(1, 1)',
              background:
                'radial-gradient(110% 110% at 32% 26%, rgba(255, 255, 255, 0.70) 0%, rgba(255, 255, 255, 0.28) 45%, rgba(255, 255, 255, 0.10) 100%)',
              border: '1.5px solid rgba(255, 255, 255, 0.85)',
              boxShadow:
                'inset 0 2px 4px 0 rgba(255, 255, 255, 0.95), inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.18), 0 4px 18px rgba(0, 0, 0, 0.22)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              transition: isDraggingPill
                ? 'none'
                : 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1), width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
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
                    ? 'text-ink font-bold drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]'
                    : 'text-ink-soft/85 hover:text-ink drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)]'
                }`}
              >
                <span className="relative z-10">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill={isSelected ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={isSelected ? '2.4' : '1.8'}
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
        <div aria-hidden="true" className="relative z-10 h-7 w-px bg-white/40" />

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

      {/* Inline styles for water droplet wobble spring oscillation */}
      <style jsx>{`
        @keyframes waterWobble {
          0% {
            transform: scale(1.18, 0.84);
          }
          30% {
            transform: scale(0.88, 1.14);
          }
          55% {
            transform: scale(1.08, 0.94);
          }
          75% {
            transform: scale(0.97, 1.03);
          }
          100% {
            transform: scale(1, 1);
          }
        }
        .animate-water-wobble {
          animation: waterWobble 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </nav>
  );
}
