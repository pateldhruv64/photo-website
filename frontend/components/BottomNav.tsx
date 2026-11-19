'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import { usePathname } from 'next/navigation';
import { useSiteConfig } from '@/lib/hooks';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';

/**
 * ─────────────────────────────────────────────────────────────────────
 *  LIQUID GLASS BOTTOM NAV
 * ─────────────────────────────────────────────────────────────────────
 *
 *  Built from what Apple says in "Meet Liquid Glass" (WWDC25 session 219):
 *
 *  1. Floating rounded capsule that holds navigation only (no glass on content).
 *  2. LENSING: the glass bends the light behind it. Strong at the rim, clear in
 *     the middle. (Real refraction on Chromium browsers. Safari/Firefox get a
 *     frosted-glass fallback, because they cannot refract with CSS.)
 *  3. Rest state is quiet: the selected tab is only a soft fill. When you touch
 *     it, it "lifts" into a glass lens, grows, and glows from under the finger.
 *  4. Gel-like motion: the lens is moved by a spring. It stretches with speed
 *     (volume stays the same), overshoots a little and settles.
 *  5. Highlights: a bright rim that turns with the movement.
 *  6. Adaptive: the dock flips between light glass and dark glass depending on
 *     what is behind it, and the icons flip with it.
 *  7. No glass on glass: only the lens gets the glass effect, the WhatsApp
 *     button is a plain tinted fill.
 *  8. Accessibility: Reduce Motion removes stretch and bounce.
 *     Reduce Transparency makes the dock frostier and turns refraction off.
 */

// ─── TWEAKABLE CONSTANTS ──────────────────────────────────────────
const TAB_W = 58; // width of one tab (px)
const TAB_H = 50; // height of one tab (px)
const KNOB_W = 54; // lens width (px)
const KNOB_H = 46; // lens height (px)

const TONE_MODE: 'auto' | 'light' | 'dark' = 'auto'; // force a look, or let it adapt

// Physics (spring = stiffness k, damping c). Lower c = more bounce.
const SPRING = { k: 330, c: 27 }; // moving between tabs
const DRAG_SPRING = { k: 900, c: 52 }; // following the finger
const LIFT_SCALE = 0.15; // how much the lens grows when touched
const STRETCH_SPEED = 3200; // px/s of speed that gives the maximum stretch
const MAX_STRETCH = 0.32; // max horizontal stretch (0.32 = 32%)
const MAX_SKEW = 7; // max lean in degrees while moving
const RUBBER = 0.3; // resistance when dragging past the ends

// Refraction (Chromium only)
const REFRACTION = true; // set false to use the frosted look everywhere
const DOCK_BEZEL = 16; // px of the dock rim that bends light
const DOCK_BEND = 14; // how many px the rim shifts the picture
const KNOB_BEZEL = 14;
const KNOB_BEND = 22;

// ─── ICONS ────────────────────────────────────────────────────────
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
  reviews: (
    <polygon points="12 2.5 14.9 8.4 21.4 9.3 16.7 13.9 17.8 20.3 12 17.3 6.2 20.3 7.3 13.9 2.6 9.3 9.1 8.4 12 2.5" />
  ),
  pricing: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.3" />
    </>
  ),
};

// Exact page order: Home -> Work -> Reviews -> Pricing, then Chat
const SECTIONS = [
  { key: 'home', label: 'Home', icon: ICON.home, id: null },
  { key: 'gallery', label: 'Work', icon: ICON.gallery, id: 'gallery-section' },
  {
    key: 'reviews',
    label: 'Reviews',
    icon: ICON.reviews,
    id: 'testimonials-section',
  },
  {
    key: 'pricing',
    label: 'Pricing',
    icon: ICON.pricing,
    id: 'pricing-section',
  },
] as const;

const COUNT = SECTIONS.length;
const TRACK_W = COUNT * TAB_W;
const KNOB_PAD = (TAB_W - KNOB_W) / 2;
const knobLeft = (i: number) => i * TAB_W + KNOB_PAD;

// ─── SMALL HELPERS ────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** Drag position with rubber-band resistance past the first/last tab */
function band(raw: number) {
  const lo = knobLeft(0);
  const hi = knobLeft(COUNT - 1);
  if (raw < lo) return lo + (raw - lo) * RUBBER;
  if (raw > hi) return hi + (raw - hi) * RUBBER;
  return raw;
}

type NavWithUAData = Navigator & {
  userAgentData?: { brands?: { brand: string }[] };
};

/**
 * Only Chromium (Chrome, Edge, Brave, Android browsers) can run an SVG filter
 * inside backdrop-filter. Safari parses it and then draws NOTHING, and
 * @supports cannot tell the difference, so we detect by engine instead.
 */
function engineCanRefract() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS =
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (iOS) return false; // every browser on iOS uses WebKit
  const brands = (navigator as NavWithUAData).userAgentData?.brands;
  if (brands)
    return brands.some((b) =>
      /Chromium|Google Chrome|Microsoft Edge/i.test(b.brand),
    );
  return /Chrome\/\d+/.test(ua) && !/Firefox|FxiOS/.test(ua);
}

/**
 * Draws a "displacement map" for a capsule shape.
 * Red = how far to move the picture sideways, green = up/down (128 = no move).
 * Inside the rim the picture is pulled toward the middle, strongest at the very
 * edge and fading to nothing. That is what makes a glass edge look thick.
 */
function makeLensMap(w: number, h: number, bezel: number): string {
  const res = 2;
  const W = Math.max(2, Math.round(w * res));
  const H = Math.max(2, Math.round(h * res));
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const hx = W / 2;
  const hy = H / 2;
  const r = Math.min(hx, hy);
  const b = bezel * res;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5 - hx;
      const py = y + 0.5 - hy;
      const qx = Math.abs(px) - (hx - r);
      const qy = Math.abs(py) - (hy - r);
      const sdf =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
        Math.min(Math.max(qx, qy), 0) -
        r;
      const depth = -sdf; // distance inside from the edge
      let m = 0;
      let nx = 0;
      let ny = 0;
      if (depth > 0 && depth < b) {
        let gx: number;
        let gy: number;
        if (qx > 0 && qy > 0) {
          const len = Math.hypot(qx, qy) || 1;
          gx = (Math.sign(px) * qx) / len;
          gy = (Math.sign(py) * qy) / len;
        } else if (qx > qy) {
          gx = Math.sign(px);
          gy = 0;
        } else {
          gx = 0;
          gy = Math.sign(py);
        }
        nx = -gx; // pointing inward
        ny = -gy;
        m = Math.pow(1 - depth / b, 2.2);
      }
      const i = (y * W + x) * 4;
      d[i] = 128 + 127 * m * nx;
      d[i + 1] = 128 + 127 * m * ny;
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

/** Brightness (0 to 1) of the first solid background behind the dock, or null if unknown (photo, gradient...) */
function probeLuminance(
  skip: Element | null,
  x: number,
  y: number,
): number | null {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    if (skip && skip.contains(el)) continue;
    const tag = el.tagName;
    if (
      tag === 'IMG' ||
      tag === 'VIDEO' ||
      tag === 'CANVAS' ||
      tag === 'PICTURE'
    )
      return null;
    const cs = getComputedStyle(el);
    if (parseFloat(cs.opacity) < 0.85) continue;
    if (cs.backgroundImage && cs.backgroundImage !== 'none') {
      if (cs.backgroundImage.includes('url(')) return null;
      continue; // gradients: look at what is below
    }
    const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
    if (!m) continue;
    const p = m[1]
      .split(/[,\s/]+/)
      .filter(Boolean)
      .map(Number);
    const a = p.length > 3 ? p[3] : 1;
    if (a < 0.85) continue;
    return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;
  }
  return null;
}

// ─── STYLES (plain CSS, prefixed lg-) ─────────────────────────────
const CSS = `
.lg-dock{--lg-a:135deg;--lg-glow:0;--lg-dx:50%}
.lg-dock[data-tone="light"]{
  --lg-fg:#142433;--lg-fg-soft:rgba(20,36,51,.6);
  --lg-tint:rgba(255,255,255,.30);--lg-tint-solid:rgba(247,249,252,.94);
  --lg-edge:rgba(255,255,255,.98);--lg-edge-soft:rgba(255,255,255,.18);
  --lg-outline:rgba(20,36,51,.10);--lg-knob:rgba(20,36,51,.09);--lg-lens:rgba(255,255,255,.16);
  --lg-shadow:0 12px 32px -8px rgba(15,25,35,.30),0 2px 8px rgba(15,25,35,.10);
}
.lg-dock[data-tone="dark"]{
  --lg-fg:#ffffff;--lg-fg-soft:rgba(255,255,255,.74);
  --lg-tint:rgba(14,20,28,.28);--lg-tint-solid:rgba(22,28,36,.94);
  --lg-edge:rgba(255,255,255,.80);--lg-edge-soft:rgba(255,255,255,.07);
  --lg-outline:rgba(0,0,0,.30);--lg-knob:rgba(255,255,255,.17);--lg-lens:rgba(255,255,255,.10);
  --lg-shadow:0 14px 34px -8px rgba(0,0,0,.50),0 2px 8px rgba(0,0,0,.25);
}
.lg-dock{box-shadow:var(--lg-shadow);transition:box-shadow .35s ease}
.lg-body{position:absolute;inset:0;border-radius:9999px;pointer-events:none;
  background-color:var(--lg-tint);transition:background-color .35s ease;
  box-shadow:inset 0 1px 1px rgba(255,255,255,.55),inset 0 -1px 1px var(--lg-outline),0 0 0 .5px var(--lg-outline)}
.lg-sheen{position:absolute;inset:0;border-radius:inherit;
  background:linear-gradient(180deg,rgba(255,255,255,.26) 0%,rgba(255,255,255,0) 46%,rgba(255,255,255,.07) 100%)}
.lg-dockglow{position:absolute;inset:0;border-radius:inherit;opacity:var(--lg-glow);
  background:radial-gradient(90px 60px at var(--lg-dx) 50%,rgba(255,255,255,.42),rgba(255,255,255,0) 70%)}
.lg-rim{position:absolute;inset:0;border-radius:inherit;padding:1.3px;pointer-events:none;
  background:conic-gradient(from var(--lg-a),var(--lg-edge) 0deg,var(--lg-edge-soft) 70deg,var(--lg-edge-soft) 160deg,var(--lg-edge) 180deg,var(--lg-edge-soft) 250deg,var(--lg-edge-soft) 340deg,var(--lg-edge) 360deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  mask-composite:exclude}
.lg-knob{position:absolute;top:${(TAB_H - KNOB_H) / 2}px;left:0;width:${KNOB_W}px;height:${KNOB_H}px;
  border-radius:9999px;pointer-events:none;will-change:transform}
.lg-knob-rest{position:absolute;inset:0;border-radius:inherit;background-color:var(--lg-knob);transition:background-color .35s ease}
.lg-knob-glass{position:absolute;inset:0;border-radius:inherit;opacity:0;background-color:var(--lg-lens);
  box-shadow:inset 0 1.5px 2px rgba(255,255,255,.9),inset 0 -1.5px 2px rgba(0,0,0,.14),0 8px 22px rgba(10,20,30,.24)}
.lg-knob-glow{position:absolute;inset:0;border-radius:inherit;opacity:0;pointer-events:none}
.lg-fg{color:var(--lg-fg-soft);transition:color .25s ease}
.lg-fg[aria-current="true"]{color:var(--lg-fg)}
.lg-btn:focus-visible{outline:2px solid var(--lg-fg);outline-offset:-3px}
@media (prefers-reduced-transparency:reduce){
  .lg-body{background-color:var(--lg-tint-solid);
    -webkit-backdrop-filter:blur(28px) saturate(1.1)!important;backdrop-filter:blur(28px) saturate(1.1)!important}
}
`;

type Maps = { dock: string; dockW: number; dockH: number; knob: string };

// ─── COMPONENT ────────────────────────────────────────────────────
export default function BottomNav() {
  const pathname = usePathname();
  const config = useSiteConfig();
  const whatsappUrl = getWhatsAppUrl(config);
  const isHome = pathname === '/';

  const [active, setActive] = useState<string>('home');
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [tone, setTone] = useState<'light' | 'dark'>(
    TONE_MODE === 'light' ? 'light' : 'dark',
  );
  const [refract, setRefract] = useState(false);
  const [maps, setMaps] = useState<Maps | null>(null);

  const navRef = useRef<HTMLElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const restRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const pressedRef = useRef(false);
  const movedRef = useRef(false);
  const draggingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const startXRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const lockRef = useRef(false);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spySyncRef = useRef<(() => void) | null>(null);
  const toneRef = useRef<'light' | 'dark'>(
    TONE_MODE === 'light' ? 'light' : 'dark',
  );

  const activeIdx = SECTIONS.findIndex((s) => s.key === active);

  // ── physics state (lives in a ref, no React re-render per frame) ──
  const sim = useRef({
    x: knobLeft(0),
    vx: 0,
    tx: knobLeft(0),
    lift: 0,
    vlift: 0,
    tlift: 0,
    glow: 0,
    vglow: 0,
    tglow: 0,
    pres: 0,
    vpres: 0,
    tpres: 1,
    gx: KNOB_W / 2,
    gy: KNOB_H / 2,
    angle: 135,
    tangle: 135,
  });
  const rafRef = useRef(0);
  const lastTRef = useRef(0);
  const loopRef = useRef<(t: number) => void>(() => {});

  // Write the current physics state to the DOM
  const apply = useCallback(() => {
    const s = sim.current;
    const knob = knobRef.current;
    if (!knob) return;
    const reduced = reducedMotionRef.current;
    const lift = clamp(s.lift, 0, 1.25);
    const lift01 = clamp(s.lift, 0, 1);
    const pres = clamp(s.pres, 0, 1);

    // gel: stretch with speed, keep volume (wider -> flatter), lean a little
    const stretch = reduced
      ? 0
      : Math.min(Math.abs(s.vx) / STRETCH_SPEED, MAX_STRETCH);
    const grow = reduced ? 1 + 0.06 * lift01 : 1 + LIFT_SCALE * lift;
    const appear = 0.86 + 0.14 * pres;
    const sx = grow * (1 + stretch) * appear;
    const sy = (grow / Math.sqrt(1 + stretch)) * appear;
    const skew = reduced ? 0 : clamp(-s.vx / 260, -MAX_SKEW, MAX_SKEW);

    knob.style.transform = `translate3d(${s.x.toFixed(2)}px,0,0) scale(${sx.toFixed(4)},${sy.toFixed(4)}) skewX(${skew.toFixed(2)}deg)`;
    knob.style.zIndex = lift01 > 0.04 ? '3' : '1'; // lens sits above the icons while touched

    if (restRef.current)
      restRef.current.style.opacity = String((1 - lift01) * pres);
    if (glassRef.current)
      glassRef.current.style.opacity = String(lift01 * pres);
    if (glowRef.current) {
      glowRef.current.style.opacity = String(clamp(s.glow, 0, 1) * pres);
      glowRef.current.style.background = `radial-gradient(circle at ${s.gx.toFixed(1)}px ${s.gy.toFixed(1)}px,rgba(255,255,255,.75),rgba(255,255,255,0) 62%)`;
    }
    const dock = dockRef.current;
    if (dock) {
      dock.style.setProperty('--lg-a', `${s.angle.toFixed(1)}deg`);
      dock.style.setProperty(
        '--lg-glow',
        String(clamp(s.glow, 0, 1) * pres * 0.9),
      );
      dock.style.setProperty(
        '--lg-dx',
        `${(s.x + KNOB_W / 2 + 6).toFixed(1)}px`,
      );
    }
  }, []);

  // The spring loop. It sleeps when everything has settled.
  loopRef.current = (now: number) => {
    const s = sim.current;
    let dt = (now - lastTRef.current) / 1000;
    lastTRef.current = now;
    if (!(dt > 0)) dt = 1 / 60;
    dt = Math.min(dt, 1 / 30);
    const n = Math.max(1, Math.ceil(dt * 120));
    const h = dt / n;
    const reduced = reducedMotionRef.current;
    const dragging = draggingRef.current;
    const kx = dragging ? DRAG_SPRING.k : reduced ? 600 : SPRING.k;
    const cx = dragging ? DRAG_SPRING.c : reduced ? 49 : SPRING.c;

    for (let i = 0; i < n; i++) {
      s.vx += (-kx * (s.x - s.tx) - cx * s.vx) * h;
      s.x += s.vx * h;
      s.vlift +=
        (-420 * (s.lift - s.tlift) - (reduced ? 41 : 30) * s.vlift) * h;
      s.lift += s.vlift * h;
      s.vglow += (-240 * (s.glow - s.tglow) - 28 * s.vglow) * h;
      s.glow += s.vglow * h;
      s.vpres += (-300 * (s.pres - s.tpres) - 31 * s.vpres) * h;
      s.pres += s.vpres * h;
    }
    // the bright rim turns a little with the movement
    s.tangle = 135 + (reduced ? 0 : clamp(s.vx / 22, -28, 28));
    s.angle += (s.tangle - s.angle) * Math.min(1, dt * 10);

    apply();

    const awake =
      dragging ||
      Math.abs(s.vx) > 1 ||
      Math.abs(s.x - s.tx) > 0.03 ||
      Math.abs(s.vlift) > 0.01 ||
      Math.abs(s.lift - s.tlift) > 0.002 ||
      Math.abs(s.vglow) > 0.01 ||
      Math.abs(s.glow - s.tglow) > 0.002 ||
      Math.abs(s.vpres) > 0.01 ||
      Math.abs(s.pres - s.tpres) > 0.002 ||
      Math.abs(s.angle - s.tangle) > 0.2;

    if (awake) {
      rafRef.current = requestAnimationFrame(loopRef.current);
    } else {
      s.x = s.tx;
      s.vx = 0;
      s.lift = s.tlift;
      s.vlift = 0;
      s.glow = s.tglow;
      s.vglow = 0;
      s.pres = s.tpres;
      s.vpres = 0;
      s.angle = s.tangle;
      apply();
      rafRef.current = 0;
    }
  };

  const wake = useCallback(() => {
    if (rafRef.current) return;
    lastTRef.current = performance.now();
    rafRef.current = requestAnimationFrame((t) => loopRef.current(t));
  }, []);

  // ── setup: engine detection, accessibility settings, first paint ──
  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqTrans = window.matchMedia('(prefers-reduced-transparency: reduce)');
    const readPrefs = () => {
      reducedMotionRef.current = mqMotion.matches;
      setRefract(REFRACTION && engineCanRefract() && !mqTrans.matches);
    };
    readPrefs();
    mqMotion.addEventListener('change', readPrefs);
    mqTrans.addEventListener('change', readPrefs);

    // put the lens on the right tab without any sliding on first load
    const s = sim.current;
    s.x = s.tx;
    s.pres = s.tpres;
    apply();

    return () => {
      mqMotion.removeEventListener('change', readPrefs);
      mqTrans.removeEventListener('change', readPrefs);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, [apply]);

  // ── refraction maps: draw once per size (Chromium only) ──
  useEffect(() => {
    if (!refract) {
      setMaps(null);
      return;
    }
    const dock = dockRef.current;
    if (!dock) return;
    let lastW = 0;
    let lastH = 0;
    const build = () => {
      const w = dock.offsetWidth;
      const h = dock.offsetHeight;
      if (!w || !h || (w === lastW && h === lastH)) return;
      lastW = w;
      lastH = h;
      setMaps({
        dock: makeLensMap(w, h, DOCK_BEZEL),
        dockW: w,
        dockH: h,
        knob: makeLensMap(KNOB_W, KNOB_H, KNOB_BEZEL),
      });
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(dock);
    return () => ro.disconnect();
  }, [refract]);

  // ── lens follows the active tab (and fades out when no tab is active) ──
  useEffect(() => {
    const s = sim.current;
    if (activeIdx >= 0 && !draggingRef.current) s.tx = knobLeft(activeIdx);
    s.tpres = activeIdx >= 0 ? 1 : 0;
    wake();
  }, [activeIdx, wake]);

  // ── adaptive light / dark glass ──
  useEffect(() => {
    if (TONE_MODE !== 'auto') return;
    let last = 0;
    let frame = 0;
    const run = () => {
      frame = 0;
      const nav = navRef.current;
      const dock = dockRef.current;
      if (!nav || !dock) return;
      const now = performance.now();
      if (now - last < 100) return;
      last = now;
      try {
        const r = dock.getBoundingClientRect();
        const lum = probeLuminance(
          nav,
          window.innerWidth / 2,
          r.top + r.height / 2,
        );
        if (lum === null) return; // unknown (photo): keep the current look
        const next =
          toneRef.current === 'dark'
            ? lum > 0.66
              ? 'light'
              : 'dark'
            : lum < 0.5
              ? 'dark'
              : 'light';
        if (next !== toneRef.current) {
          toneRef.current = next;
          setTone(next);
        }
      } catch {
        /* ignore */
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(run);
    };
    const first = setTimeout(run, 150);
    const later = setTimeout(run, 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      clearTimeout(first);
      clearTimeout(later);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  // ── scroll spy: Home -> Work -> Reviews -> Pricing ──
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
          return {
            key: s.key,
            top: el.getBoundingClientRect().top + window.scrollY,
          };
        })
        .filter(Boolean) as Array<{ key: string; top: number }>;
      offsets.sort((a, b) => a.top - b.top);
    };

    const update = () => {
      frame = 0;
      if (!offsets.length || pressedRef.current || lockRef.current) return;

      const probe = window.scrollY + window.innerHeight / 2;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 6;
      if (atBottom) {
        setActive('pricing');
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

    spySyncRef.current = onScroll;
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
      spySyncRef.current = null;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isHome, pathname]);

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/client'))
    return null;

  // ─── Navigation ───
  // While the page scrolls to the chosen section, the scroll spy is paused so
  // the lens does not race across every tab on the way.
  const lockSpy = () => {
    lockRef.current = true;
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    const unlock = () => {
      lockRef.current = false;
      window.removeEventListener('scrollend', unlock);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      spySyncRef.current?.();
    };
    window.addEventListener('scrollend', unlock, { once: true });
    lockTimerRef.current = setTimeout(unlock, 1100);
  };

  const handleTabClick = (idx: number) => {
    const { key, id } = SECTIONS[idx];
    setActive(key);
    sim.current.tx = knobLeft(idx);
    wake();

    if (key === 'home') {
      if (isHome) {
        lockSpy();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.location.href = '/';
      }
    } else if (id) {
      if (isHome) {
        const el = document.getElementById(id);
        if (el) {
          lockSpy();
          el.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        window.location.href = `/#${id}`;
      }
    }
  };

  // ─── Touch and drag ───
  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    const r = track.getBoundingClientRect();
    const s = sim.current;
    pressedRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    // the glass lifts and lights up right under the finger
    s.tlift = 1;
    s.tglow = 1;
    s.gx = clamp(e.clientX - r.left - s.x, 0, KNOB_W);
    s.gy = clamp(e.clientY - r.top - (TAB_H - KNOB_H) / 2, 0, KNOB_H);
    wake();
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!pressedRef.current) return;
    const track = trackRef.current;
    if (!track) return;
    const s = sim.current;
    const r = track.getBoundingClientRect();

    if (!movedRef.current && Math.abs(e.clientX - startXRef.current) > 4) {
      movedRef.current = true;
      draggingRef.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }

    if (movedRef.current) {
      s.tx = band(e.clientX - r.left - KNOB_W / 2);
      const idx = clamp(Math.floor((e.clientX - r.left) / TAB_W), 0, COUNT - 1);
      setPreviewIdx((p) => (p === idx ? p : idx));
    }
    s.gx = clamp(e.clientX - r.left - s.x, 0, KNOB_W);
    s.gy = clamp(e.clientY - r.top - (TAB_H - KNOB_H) / 2, 0, KNOB_H);
    wake();
  };

  const finishPointer = (e: RPointerEvent<HTMLDivElement>, commit: boolean) => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    const s = sim.current;
    s.tlift = 0;
    s.tglow = 0;

    if (movedRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
      draggingRef.current = false;
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      setPreviewIdx(null);

      const r = trackRef.current?.getBoundingClientRect();
      if (commit && r) {
        handleTabClick(
          clamp(Math.floor((e.clientX - r.left) / TAB_W), 0, COUNT - 1),
        );
      } else if (activeIdx >= 0) {
        s.tx = knobLeft(activeIdx);
      }
    }
    wake();
  };

  const shownKey = previewIdx !== null ? SECTIONS[previewIdx].key : active;

  // ─── Glass recipes ───
  const useRefraction = refract && maps !== null;
  const dockBackdrop = useRefraction
    ? 'blur(6px) saturate(1.8) url(#lg-dock-fx)'
    : 'blur(14px) saturate(1.8)';
  const knobBackdrop = useRefraction
    ? 'saturate(1.5) brightness(1.06) url(#lg-knob-fx)'
    : 'saturate(1.6) brightness(1.08)';

  return (
    <nav
      ref={navRef}
      id="bottom-nav"
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.85rem)] md:hidden select-none pointer-events-none"
    >
      <style>{CSS}</style>

      {/* SVG lens filters (Chromium only). Must stay in the page, not display:none */}
      {useRefraction && maps && (
        <svg
          width="0"
          height="0"
          aria-hidden="true"
          focusable="false"
          style={{ position: 'absolute', pointerEvents: 'none' }}
        >
          <defs>
            <filter
              id="lg-dock-fx"
              x="0"
              y="0"
              width={maps.dockW}
              height={maps.dockH}
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={maps.dock}
                x="0"
                y="0"
                width={maps.dockW}
                height={maps.dockH}
                preserveAspectRatio="none"
                result="map"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={DOCK_BEND * 2}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            <filter
              id="lg-knob-fx"
              x="0"
              y="0"
              width={KNOB_W}
              height={KNOB_H}
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={maps.knob}
                x="0"
                y="0"
                width={KNOB_W}
                height={KNOB_H}
                preserveAspectRatio="none"
                result="map"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={KNOB_BEND * 2}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}

      {/* The dock itself must not have opacity / filter, or the glass inside
          would stop seeing the page behind it. */}
      <div
        ref={dockRef}
        data-tone={tone}
        className="lg-dock pointer-events-auto relative flex items-center gap-1.5 rounded-full p-1.5"
      >
        {/* Layer 1: the glass body */}
        <div
          aria-hidden="true"
          className="lg-body"
          style={{
            backdropFilter: dockBackdrop,
            WebkitBackdropFilter: dockBackdrop,
          }}
        >
          <div className="lg-sheen" />
          <div className="lg-dockglow" />
          <div className="lg-rim" />
        </div>

        {/* Layer 2: tabs + the moving lens */}
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => finishPointer(e, true)}
          onPointerCancel={(e) => finishPointer(e, false)}
          className="relative z-10 touch-none"
          style={{ width: TRACK_W, height: TAB_H, display: 'flex' }}
        >
          {/* Lens: quiet fill at rest, real glass while touched */}
          <div
            ref={knobRef}
            aria-hidden="true"
            className="lg-knob"
            style={{ zIndex: 1 }}
          >
            <div ref={restRef} className="lg-knob-rest" />
            <div
              ref={glassRef}
              className="lg-knob-glass"
              style={{
                backdropFilter: knobBackdrop,
                WebkitBackdropFilter: knobBackdrop,
              }}
            >
              <div className="lg-rim" />
            </div>
            <div ref={glowRef} className="lg-knob-glow" />
          </div>

          {SECTIONS.map((item, idx) => {
            const selected = shownKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-current={selected ? 'true' : undefined}
                onClick={() => {
                  if (suppressClickRef.current) return;
                  handleTabClick(idx);
                }}
                className="lg-btn lg-fg relative z-[2] flex flex-col items-center justify-center gap-[3px] rounded-full outline-none"
                style={{ width: TAB_W, height: TAB_H }}
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={selected ? 2.2 : 1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none"
                >
                  {item.icon}
                </svg>
                <span
                  className="pointer-events-none text-[9.5px] leading-none tracking-[0.04em]"
                  style={{ fontWeight: selected ? 600 : 500 }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div
          aria-hidden="true"
          className="relative z-10 h-7 w-px"
          style={{ background: 'var(--lg-outline)' }}
        />

        {/* WhatsApp: plain tinted fill (no glass on glass), the one accent colour */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="lg-btn relative z-10 flex flex-col items-center justify-center gap-[3px] rounded-full text-white transition-transform duration-200 active:scale-90"
            style={{
              width: TAB_W,
              height: TAB_H,
              background:
                'linear-gradient(180deg,#3BE07C 0%,#25D366 55%,#1FB957 100%)',
              boxShadow:
                'inset 0 1.5px 1.5px rgba(255,255,255,.65),inset 0 -1.5px 2px rgba(0,60,20,.25),0 4px 14px rgba(37,211,102,.4)',
            }}
          >
            <WhatsAppIcon size={20} />
            <span className="text-[9.5px] font-semibold leading-none tracking-[0.04em]">
              Chat
            </span>
          </a>
        )}
      </div>
    </nav>
  );
}
