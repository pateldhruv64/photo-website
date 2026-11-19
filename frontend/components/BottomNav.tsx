'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import { usePathname } from 'next/navigation';
import { useSiteConfig } from '@/lib/hooks';
import { getWhatsAppUrl } from '@/lib/whatsapp';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';

/**
 * ─────────────────────────────────────────────────────────────────────
 *  LIQUID GLASS BOTTOM NAV (v5 — True iOS 26 Clear Lens & Rim Optics)
 * ─────────────────────────────────────────────────────────────────────
 *  Fixes vs v4:
 *  1. Adaptive Light/Dark glass (`auto`, light default): keeps light
 *     translucent glass + dark icons on light pages (never forces black).
 *  2. Authentic iOS overhang: lifted lens grows to ~72px tall (overhanging
 *     ~5px above & below the 62px dock) so dock borders refract inside the
 *     top/bottom glass rim while the centered icon & label sit in crystal-
 *     clear glass.
 *  3. Two-stage SVG optics:
 *     - Stage 1: pure achromatic center magnification (zero rainbow on text).
 *     - Stage 2: outer rim-only meniscus bend + crisp prismatic RGB caustics
 *       strictly along the curved glass edge.
 *  4. Pure clear lens interior (no grey vignette or milky white wash) +
 *     subtle drag widening (66px rest -> ~79px lift -> ~90px drag) + zero blink.
 */

// ─── TWEAKABLE CONSTANTS ──────────────────────────────────────────
const TAB_W = 58; // width of one tab (px)
const TAB_H = 50; // height of one tab (px)
const KNOB_W = 66; // resting pill width (px)
const KNOB_H = 50; // resting pill height (px) — sits neatly inside 62px dock
const KNOB_TOP = (TAB_H - KNOB_H) / 2;

// Adapts to background: light glass + dark icons on light pages, dark glass on dark sections
const TONE_MODE: 'auto' | 'light' | 'dark' = 'auto';

// Physics: responsive liquid-mercury feel
const SPRING = { k: 420, c: 28 }; // snappy glide + smooth settle
const DRAG_SPRING = { k: 920, c: 50 }; // glued to finger with subtle inertia
const LIFT_X = 0.2; // ~79px wide on tap/hold
const LIFT_Y = 0.44; // ~72px tall on tap/hold -> pops ~5px above & below the 62px dock!
const DRAG_WIDEN = 0.14; // gentle extra width on drag (~90px total, never bloated)
const WIDEN_SPRING = { k: 400, c: 25 };
const STRETCH_SPEED = 2600; // px/s for max velocity stretch
const MAX_STRETCH = 0.08; // subtle organic gel stretch on fast flicks
const MAX_SKEW = 4; // subtle lean while gliding
const RUBBER = 0.26; // resistance past ends
const EDGE_ROOM = 8; // px lens may overhang left/right dock edges

// Optical Refraction (Chromium real two-stage SVG lens)
const REFRACTION = true;
const DOCK_BEZEL = 16;
const DOCK_BEND = 10;
const KNOB_BG_MAGNIFY = 1.13; // Stage 1: clean achromatic magnification across lens
const KNOB_MAG_RANGE = 5; // max px headroom for Stage 1 magnification map
const KNOB_BEZEL = 11; // Stage 2: curved rim thickness (in pre-scale px -> ~15.5px visual)
const KNOB_BEND = 11; // Stage 2: rich curved-glass meniscus bend at outer rim
const KNOB_CA = 0.22; // Stage 2: crisp iOS rainbow prism dispersion ONLY on outer rim

// Fallback magnification for Safari / Firefox
const FALLBACK_MAGNIFY = 1.13;

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

function haptic(ms: number) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  } catch {
    /* ignore */
  }
}

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

function engineCanRefract() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS =
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (iOS) return false;
  const brands = (navigator as NavWithUAData).userAgentData?.brands;
  if (brands)
    return brands.some((b) =>
      /Chromium|Google Chrome|Microsoft Edge/i.test(b.brand),
    );
  return /Chrome\/\d+/.test(ua) && !/Firefox|FxiOS/.test(ua);
}

/**
 * Stage 1 map: Pure achromatic convex magnification across the lens.
 * Applied uniformly to R, G, and B together -> razor-sharp icons with ZERO rainbow text.
 */
function makeMagMap(
  w: number,
  h: number,
  magnify: number,
  range: number,
): string {
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
  const factor = magnify > 1 ? (1 - 1 / magnify) / range : 0;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = (x + 0.5 - hx) / res;
      const py = (y + 0.5 - hy) / res;
      const vx = clamp(-px * factor, -1, 1);
      const vy = clamp(-py * factor, -1, 1);
      const i = (y * W + x) * 4;
      d[i] = Math.round(128 + 127 * vx);
      d[i + 1] = Math.round(128 + 127 * vy);
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Stage 2 map: Pure outer-rim meniscus refraction (neutral 128 in the entire center).
 * Splitting RGB on THIS map only puts chromatic dispersion strictly on the curved glass rim!
 */
function makeRimMap(w: number, h: number, bezel: number): string {
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
      const depth = -sdf;
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
        nx = -gx;
        ny = -gy;
        // Steep liquid-glass edge profile: strong curve at rim, 0 across the center
        const t = depth / b;
        m = Math.pow(1 - t, 2.2);
      }
      const i = (y * W + x) * 4;
      d[i] = Math.round(128 + 127 * clamp(m * nx, -1, 1));
      d[i + 1] = Math.round(128 + 127 * clamp(m * ny, -1, 1));
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

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
      continue;
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

// ─── STYLES (backdrop-filter & initial opacity stay here -> zero blink) ──
const CSS = `
.lg-dock{--lg-a:135deg;--lg-glow:0;--lg-dx:50%}

/* Light Glass (default on light pages — dark crisp icons, translucent frosted bar, crystal-clear lens) */
.lg-dock[data-tone="light"]{
  --lg-fg:#142433;
  --lg-fg-soft:rgba(20,36,51,.58);
  --lg-tint:rgba(255,255,255,.46);
  --lg-tint-solid:rgba(248,250,252,.94);
  --lg-edge:rgba(255,255,255,.98);
  --lg-edge-soft:rgba(255,255,255,.26);
  --lg-outline:rgba(20,36,51,.11);
  --lg-knob:rgba(20,36,51,.085);
  --lg-lens-shadow:
    inset 0 1.2px 1px rgba(255,255,255,.92),
    inset 0 -1px 1px rgba(20,36,51,.10),
    0 0 0 .7px rgba(20,36,51,.18),
    0 6px 20px -4px rgba(15,25,35,.18);
  --lg-shadow:0 10px 30px -8px rgba(15,25,35,.22),0 2px 8px rgba(15,25,35,.08);
}

/* Dark Smoked Glass (activates automatically over dark sections) */
.lg-dock[data-tone="dark"]{
  --lg-fg:#ffffff;
  --lg-fg-soft:rgba(255,255,255,.80);
  --lg-tint:rgba(30,32,38,.66);
  --lg-tint-solid:rgba(22,24,28,.95);
  --lg-edge:rgba(255,255,255,.50);
  --lg-edge-soft:rgba(255,255,255,.10);
  --lg-outline:rgba(255,255,255,.14);
  --lg-knob:rgba(0,0,0,.44);
  --lg-lens-shadow:
    inset 0 1px 1px rgba(255,255,255,.55),
    inset 0 -1px 1px rgba(255,255,255,.18),
    0 0 0 .8px rgba(0,0,0,.55),
    0 8px 24px -4px rgba(0,0,0,.50);
  --lg-shadow:0 14px 36px -8px rgba(0,0,0,.52),0 2px 10px rgba(0,0,0,.28);
}

.lg-dock{box-shadow:var(--lg-shadow);transition:box-shadow .35s ease}

.lg-body{
  position:absolute;inset:0;border-radius:9999px;pointer-events:none;
  background-color:var(--lg-tint);transition:background-color .35s ease;
  box-shadow:inset 0 1px 1px rgba(255,255,255,.55),inset 0 -1px 1px var(--lg-outline),0 0 0 .5px var(--lg-outline);
  -webkit-backdrop-filter:blur(16px) saturate(1.7);
  backdrop-filter:blur(16px) saturate(1.7);
}
.lg-dock[data-refract="true"] .lg-body{
  -webkit-backdrop-filter:blur(9px) saturate(1.65) url(#lg-dock-fx);
  backdrop-filter:blur(9px) saturate(1.65) url(#lg-dock-fx);
}

.lg-sheen{position:absolute;inset:0;border-radius:inherit;
  background:linear-gradient(180deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,0) 44%,rgba(255,255,255,.05) 100%)}
.lg-dockglow{position:absolute;inset:0;border-radius:inherit;opacity:var(--lg-glow);
  background:radial-gradient(88px 54px at var(--lg-dx) 50%,rgba(255,255,255,.22),rgba(255,255,255,0) 70%)}
.lg-rim{position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;
  background:conic-gradient(from var(--lg-a),var(--lg-edge) 0deg,var(--lg-edge-soft) 68deg,var(--lg-edge-soft) 162deg,var(--lg-edge) 180deg,var(--lg-edge-soft) 248deg,var(--lg-edge-soft) 342deg,var(--lg-edge) 360deg);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  mask-composite:exclude}

.lg-knob{position:absolute;top:${KNOB_TOP}px;left:0;width:${KNOB_W}px;height:${KNOB_H}px;
  border-radius:9999px;pointer-events:none;will-change:transform}
.lg-knob-rest-wrap{z-index:1}
.lg-knob-lens{z-index:3;opacity:0}
.lg-knob-top{will-change:auto}
.lg-knob-rest{position:absolute;inset:0;border-radius:inherit;background-color:var(--lg-knob);transition:background-color .35s ease}

/* 100% crystal-clear transparent glass lens (zero milky fill, zero grey fog) */
.lg-lens-glass{
  position:absolute;inset:0;border-radius:inherit;
  background-color:transparent;
  box-shadow:var(--lg-lens-shadow);
  -webkit-backdrop-filter:saturate(1.15);
  backdrop-filter:saturate(1.15);
}
.lg-dock[data-refract="true"] .lg-lens-glass{
  -webkit-backdrop-filter:url(#lg-knob-fx) saturate(1.18);
  backdrop-filter:url(#lg-knob-fx) saturate(1.18);
}

/* Razor-thin specular glint ONLY at the very top & bottom glass curves (center stays 100% clear) */
.lg-lens-spec{position:absolute;inset:1px;border-radius:inherit;pointer-events:none;
  background:linear-gradient(180deg,rgba(255,255,255,.26) 0%,rgba(255,255,255,0) 16%,rgba(255,255,255,0) 86%,rgba(255,255,255,.14) 100%)}
.lg-knob-glow{position:absolute;inset:0;border-radius:inherit;opacity:0;pointer-events:none}

/* Fallback-only magnified icon copy (Safari / Firefox) */
.lg-lens-clip{position:absolute;inset:0;border-radius:inherit;overflow:hidden;isolation:isolate;transform:translateZ(0)}
.lg-counter{position:absolute;inset:0}
.lg-clone-row{position:absolute;left:0;top:0;width:${TRACK_W}px;height:${TAB_H}px;display:flex}
.lg-clone-tab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:var(--lg-fg)}
.lg-fallback-ca{position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  box-shadow:
    inset 1.5px 0 2.5px -0.5px rgba(255,95,120,.30),
    inset -1.5px 0 2.5px -0.5px rgba(65,175,255,.30),
    inset 0 1.5px 2px -0.5px rgba(255,215,100,.22),
    inset 0 -1.5px 2px -0.5px rgba(95,255,210,.20)}

.lg-fg{color:var(--lg-fg-soft);transition:color .2s ease}
.lg-fg[aria-current="true"]{color:var(--lg-fg)}
.lg-btn:focus-visible{outline:2px solid var(--lg-fg);outline-offset:-3px}

@media (prefers-reduced-transparency:reduce){
  .lg-body{background-color:var(--lg-tint-solid)!important;
    -webkit-backdrop-filter:blur(24px) saturate(1.1)!important;
    backdrop-filter:blur(24px) saturate(1.1)!important}
}
`;

type Maps = {
  dock: string;
  dockW: number;
  dockH: number;
  knobMag: string;
  knobRim: string;
};

// ─── COMPONENT ────────────────────────────────────────────────────
export default function BottomNav() {
  const pathname = usePathname();
  const config = useSiteConfig();
  const whatsappUrl = getWhatsAppUrl(config);
  const isHome = pathname === '/';

  const [active, setActive] = useState<string>('home');
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [tone, setTone] = useState<'light' | 'dark'>(
    TONE_MODE === 'dark' ? 'dark' : 'light',
  );
  const [refract, setRefract] = useState(false);
  const [maps, setMaps] = useState<Maps | null>(null);

  const navRef = useRef<HTMLElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const restKnobRef = useRef<HTMLDivElement>(null);
  const restFillRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const cloneRowRef = useRef<HTMLDivElement>(null);

  const pressedRef = useRef(false);
  const movedRef = useRef(false);
  const draggingRef = useRef(false);
  const tapGlidingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const startXRef = useRef(0);
  const grabOffsetRef = useRef(0);
  const lastPreviewRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const lockRef = useRef(false);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spySyncRef = useRef<(() => void) | null>(null);
  const toneRef = useRef<'light' | 'dark'>(
    TONE_MODE === 'dark' ? 'dark' : 'light',
  );

  const useRefraction = refract && maps !== null;
  const useRefractionRef = useRef(useRefraction);
  useRefractionRef.current = useRefraction;

  const activeIdx = SECTIONS.findIndex((s) => s.key === active);

  // ── physics state ──
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
    wide: 0,
    vwide: 0,
    twide: 0,
    gx: KNOB_W / 2,
    gy: KNOB_H / 2,
    angle: 135,
    tangle: 135,
  });
  const rafRef = useRef(0);
  const lastTRef = useRef(0);
  const loopRef = useRef<(t: number) => void>(() => {});

  const apply = useCallback(() => {
    const s = sim.current;
    const restKnob = restKnobRef.current;
    const top = topRef.current;
    if (!restKnob || !top) return;

    const reduced = reducedMotionRef.current;
    const liveRefract = useRefractionRef.current;
    const lift = clamp(s.lift, 0, 1.18);
    const lift01 = clamp(s.lift, 0, 1);
    const pres = clamp(s.pres, 0, 1);
    const wide = clamp(s.wide, 0, 1.15);

    // Subtle velocity stretch (volume-preserving)
    const stretch = reduced
      ? 0
      : Math.min(Math.abs(s.vx) / STRETCH_SPEED, MAX_STRETCH);
    const growX = reduced ? 1 + 0.05 * lift01 : 1 + LIFT_X * lift;
    const growY = reduced ? 1 + 0.05 * lift01 : 1 + LIFT_Y * lift;
    const appear = 0.88 + 0.12 * pres;
    const widen = 1 + (reduced ? 0.04 : DRAG_WIDEN) * wide;

    const sx = growX * (1 + stretch) * widen * appear;
    const sy = (growY / Math.sqrt(1 + stretch)) * appear;
    const skew = reduced ? 0 : clamp(-s.vx / 360, -MAX_SKEW, MAX_SKEW);

    // Keep lens neatly aligned with dock edges (+ subtle iOS overhang)
    const half = (KNOB_W * sx) / 2;
    const center = s.x + KNOB_W / 2;
    let shift = 0;
    if (center - half < -EDGE_ROOM) shift = -EDGE_ROOM - (center - half);
    else if (center + half > TRACK_W + EDGE_ROOM)
      shift = TRACK_W + EDGE_ROOM - (center + half);

    const lensX = s.x + shift;
    const tf = `translate3d(${lensX.toFixed(2)}px,0,0) scale(${sx.toFixed(4)},${sy.toFixed(4)}) skewX(${skew.toFixed(2)}deg)`;

    // z1: Quiet resting pill
    restKnob.style.transform = tf;
    if (restFillRef.current) {
      restFillRef.current.style.opacity = String((1 - lift01) * pres);
    }

    // z3: Clear liquid glass lens (never toggle visibility -> zero GPU blink)
    const cover = lift01 * pres;
    top.style.transform = tf;
    top.style.opacity = cover < 0.004 ? '0' : cover.toFixed(4);

    if (glowRef.current) {
      glowRef.current.style.opacity = String(clamp(s.glow, 0, 1) * pres);
      glowRef.current.style.background = `radial-gradient(circle at ${s.gx.toFixed(1)}px ${s.gy.toFixed(1)}px,rgba(255,255,255,.12),rgba(255,255,255,0) 58%)`;
    }

    // Fallback magnifier ONLY for Safari / Firefox
    const row = rowRef.current;
    if (liveRefract) {
      if (row && row.style.clipPath !== 'none') {
        row.style.clipPath = 'none';
        row.style.setProperty('-webkit-clip-path', 'none');
      }
    } else {
      if (counterRef.current) {
        counterRef.current.style.transform = `skewX(${(-skew).toFixed(2)}deg) scale(${(FALLBACK_MAGNIFY / sx).toFixed(4)},${(FALLBACK_MAGNIFY / sy).toFixed(4)})`;
      }
      if (cloneRowRef.current) {
        cloneRowRef.current.style.transform = `translate3d(${(-lensX).toFixed(2)}px,${(-KNOB_TOP).toFixed(2)}px,0)`;
      }
      if (row) {
        if (lift01 < 0.02) {
          row.style.clipPath = 'none';
          row.style.setProperty('-webkit-clip-path', 'none');
        } else {
          const w = KNOB_W * sx * lift01;
          const h = KNOB_H * sy * lift01;
          const r = h / 2;
          const x0 = lensX + KNOB_W / 2 - w / 2;
          const y0 = TAB_H / 2 - h / 2;
          const d =
            `M0,0H${TRACK_W}V${TAB_H}H0Z ` +
            `M${(x0 + r).toFixed(2)},${y0.toFixed(2)}` +
            `H${(x0 + w - r).toFixed(2)}` +
            `A${r.toFixed(2)},${r.toFixed(2)} 0 0 1 ${(x0 + w - r).toFixed(2)},${(y0 + h).toFixed(2)}` +
            `H${(x0 + r).toFixed(2)}` +
            `A${r.toFixed(2)},${r.toFixed(2)} 0 0 1 ${(x0 + r).toFixed(2)},${y0.toFixed(2)}Z`;
          const v = `path(evenodd, "${d}")`;
          row.style.clipPath = v;
          row.style.setProperty('-webkit-clip-path', v);
        }
      }
    }

    const dock = dockRef.current;
    if (dock) {
      dock.style.setProperty('--lg-a', `${s.angle.toFixed(1)}deg`);
      dock.style.setProperty(
        '--lg-glow',
        String(clamp(s.glow, 0, 1) * pres * 0.75),
      );
      dock.style.setProperty(
        '--lg-dx',
        `${(lensX + KNOB_W / 2 + 6).toFixed(1)}px`,
      );
    }
  }, []);

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

    if (
      tapGlidingRef.current &&
      !pressedRef.current &&
      Math.abs(s.x - s.tx) < 10 &&
      Math.abs(s.vx) < 150
    ) {
      tapGlidingRef.current = false;
      s.tlift = 0;
      s.tglow = 0;
    }

    for (let i = 0; i < n; i++) {
      s.vx += (-kx * (s.x - s.tx) - cx * s.vx) * h;
      s.x += s.vx * h;
      s.vlift +=
        (-500 * (s.lift - s.tlift) - (reduced ? 44 : 28) * s.vlift) * h;
      s.lift += s.vlift * h;
      s.vglow += (-280 * (s.glow - s.tglow) - 30 * s.vglow) * h;
      s.glow += s.vglow * h;
      s.vpres += (-320 * (s.pres - s.tpres) - 32 * s.vpres) * h;
      s.pres += s.vpres * h;
      s.vwide +=
        (-WIDEN_SPRING.k * (s.wide - s.twide) -
          (reduced ? 40 : WIDEN_SPRING.c) * s.vwide) *
        h;
      s.wide += s.vwide * h;
    }

    s.tangle = 135 + (reduced ? 0 : clamp(s.vx / 20, -32, 32));
    s.angle += (s.tangle - s.angle) * Math.min(1, dt * 12);

    apply();

    const awake =
      dragging ||
      tapGlidingRef.current ||
      Math.abs(s.vx) > 0.8 ||
      Math.abs(s.x - s.tx) > 0.03 ||
      Math.abs(s.vlift) > 0.01 ||
      Math.abs(s.lift - s.tlift) > 0.002 ||
      Math.abs(s.vglow) > 0.01 ||
      Math.abs(s.glow - s.tglow) > 0.002 ||
      Math.abs(s.vpres) > 0.01 ||
      Math.abs(s.pres - s.tpres) > 0.002 ||
      Math.abs(s.vwide) > 0.01 ||
      Math.abs(s.wide - s.twide) > 0.002 ||
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
      s.wide = s.twide;
      s.vwide = 0;
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

  useEffect(() => {
    apply();
  }, [useRefraction, apply]);

  // ── setup ──
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

  // ── refraction maps (Chromium only) ──
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
        dock: makeRimMap(w, h, DOCK_BEZEL),
        dockW: w,
        dockH: h,
        knobMag: makeMagMap(KNOB_W, KNOB_H, KNOB_BG_MAGNIFY, KNOB_MAG_RANGE),
        knobRim: makeRimMap(KNOB_W, KNOB_H, KNOB_BEZEL),
      });
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(dock);
    return () => ro.disconnect();
  }, [refract]);

  // ── lens follows active tab ──
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
      if (now - last < 90) return;
      last = now;
      try {
        const r = dock.getBoundingClientRect();
        const lum = probeLuminance(
          nav,
          window.innerWidth / 2,
          r.top + r.height / 2,
        );
        if (lum === null) return;
        const next =
          toneRef.current === 'dark'
            ? lum > 0.62
              ? 'light'
              : 'dark'
            : lum < 0.45
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
    frame = requestAnimationFrame(run);
    const later = setTimeout(run, 450);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      clearTimeout(later);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  // ── scroll spy ──
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

  const handleTabClick = (idx: number, fromDrag = false) => {
    const { key, id } = SECTIONS[idx];
    const targetX = knobLeft(idx);
    const s = sim.current;

    if (!fromDrag && Math.abs(s.x - targetX) > 8) {
      tapGlidingRef.current = true;
      s.tlift = 0.95;
      s.tglow = 0.7;
    }

    setActive(key);
    s.tx = targetX;
    haptic(8);
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

  // ─── Touch & Drag ───
  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    const r = track.getBoundingClientRect();
    const s = sim.current;
    const localX = e.clientX - r.left;
    const pressedIdx = clamp(Math.floor(localX / TAB_W), 0, COUNT - 1);

    tapGlidingRef.current = false;
    pressedRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    lastPreviewRef.current = pressedIdx;

    if (pressedIdx === activeIdx) {
      grabOffsetRef.current = localX - (s.x + KNOB_W / 2);
    } else {
      grabOffsetRef.current = 0;
      s.tx = knobLeft(pressedIdx);
    }

    s.tlift = 1;
    s.tglow = 1;
    s.twide = 0;
    s.gx = clamp(localX - s.x, 0, KNOB_W);
    s.gy = clamp(e.clientY - r.top - KNOB_TOP, 0, KNOB_H);
    wake();
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!pressedRef.current) return;
    const track = trackRef.current;
    if (!track) return;
    const s = sim.current;
    const r = track.getBoundingClientRect();
    const localX = e.clientX - r.left;

    if (!movedRef.current && Math.abs(e.clientX - startXRef.current) > 4) {
      movedRef.current = true;
      draggingRef.current = true;
      s.twide = 1;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }

    if (movedRef.current) {
      grabOffsetRef.current *= 0.85;
      s.tx = band(localX - grabOffsetRef.current - KNOB_W / 2);

      const idx = clamp(Math.floor(localX / TAB_W), 0, COUNT - 1);
      if (lastPreviewRef.current !== idx) {
        lastPreviewRef.current = idx;
        haptic(5);
      }
      setPreviewIdx((p) => (p === idx ? p : idx));
    }

    s.gx = clamp(localX - s.x, 0, KNOB_W);
    s.gy = clamp(e.clientY - r.top - KNOB_TOP, 0, KNOB_H);
    wake();
  };

  const finishPointer = (e: RPointerEvent<HTMLDivElement>, commit: boolean) => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    const s = sim.current;
    s.tlift = 0;
    s.tglow = 0;
    s.twide = 0;

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
          true,
        );
      } else if (activeIdx >= 0) {
        s.tx = knobLeft(activeIdx);
      }
    } else if (!commit && activeIdx >= 0) {
      s.tx = knobLeft(activeIdx);
    }
    wake();
  };

  const shownKey = previewIdx !== null ? SECTIONS[previewIdx].key : active;

  return (
    <nav
      ref={navRef}
      id="bottom-nav"
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.85rem)] md:hidden select-none pointer-events-none"
    >
      <style>{CSS}</style>

      {/* SVG lens filters (Chromium only) */}
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

            {/* Two-stage crystal lens: achromatic center magnification + prismatic rim refraction */}
            <filter
              id="lg-knob-fx"
              x="0"
              y="0"
              width={KNOB_W}
              height={KNOB_H}
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              {/* Stage 1: Clean magnification across lens interior (zero RGB split on centered text) */}
              <feImage
                href={maps.knobMag}
                x="0"
                y="0"
                width={KNOB_W}
                height={KNOB_H}
                preserveAspectRatio="none"
                result="magMap"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="magMap"
                scale={KNOB_MAG_RANGE * 2}
                xChannelSelector="R"
                yChannelSelector="G"
                result="mag"
              />

              {/* Stage 2: Curved glass rim bend + rainbow dispersion strictly along the outer bezel */}
              <feImage
                href={maps.knobRim}
                x="0"
                y="0"
                width={KNOB_W}
                height={KNOB_H}
                preserveAspectRatio="none"
                result="rimMap"
              />
              <feDisplacementMap
                in="mag"
                in2="rimMap"
                scale={KNOB_BEND * 2 * (1 + KNOB_CA)}
                xChannelSelector="R"
                yChannelSelector="G"
                result="dispR"
              />
              <feColorMatrix
                in="dispR"
                type="matrix"
                values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="chR"
              />
              <feDisplacementMap
                in="mag"
                in2="rimMap"
                scale={KNOB_BEND * 2}
                xChannelSelector="R"
                yChannelSelector="G"
                result="dispG"
              />
              <feColorMatrix
                in="dispG"
                type="matrix"
                values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="chG"
              />
              <feDisplacementMap
                in="mag"
                in2="rimMap"
                scale={KNOB_BEND * 2 * (1 - KNOB_CA)}
                xChannelSelector="R"
                yChannelSelector="G"
                result="dispB"
              />
              <feColorMatrix
                in="dispB"
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                result="chB"
              />
              <feBlend in="chR" in2="chG" mode="screen" result="chRG" />
              <feBlend in="chRG" in2="chB" mode="screen" />
            </filter>
          </defs>
        </svg>
      )}

      <div
        ref={dockRef}
        data-tone={tone}
        data-refract={useRefraction ? 'true' : 'false'}
        className="lg-dock pointer-events-auto relative flex items-center gap-1.5 rounded-full p-1.5"
      >
        {/* Layer 1: Adaptive Translucent Glass Body */}
        <div aria-hidden="true" className="lg-body">
          <div className="lg-sheen" />
          <div className="lg-dockglow" />
          <div className="lg-rim" />
        </div>

        {/* Layer 2: Rest Pill (z1) < Real Tabs (z2) < Refractive Crystal Glass Lens (z3) */}
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => finishPointer(e, true)}
          onPointerCancel={(e) => finishPointer(e, false)}
          className="relative z-10 touch-none"
          style={{ width: TRACK_W, height: TAB_H, display: 'flex' }}
        >
          {/* z1: Quiet resting pill */}
          <div
            ref={restKnobRef}
            aria-hidden="true"
            className="lg-knob lg-knob-rest-wrap"
          >
            <div ref={restFillRef} className="lg-knob-rest" />
          </div>

          {/* z2: Real interactive tabs */}
          <div
            ref={rowRef}
            className="relative"
            style={{
              zIndex: 2,
              width: TRACK_W,
              height: TAB_H,
              display: 'flex',
            }}
          >
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
                  className="lg-btn lg-fg relative flex flex-col items-center justify-center gap-[3px] rounded-full outline-none"
                  style={{ width: TAB_W, height: TAB_H }}
                >
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={selected ? 2.2 : 1.75}
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

          {/* z3: Lifted Crystal-Clear Liquid Glass Lens */}
          <div
            ref={topRef}
            aria-hidden="true"
            className={`lg-knob lg-knob-lens${useRefraction ? '' : ' lg-knob-top'}`}
          >
            <div className="lg-lens-glass" />

            {/* Fallback magnified icons ONLY for Safari / Firefox */}
            {!useRefraction && (
              <div className="lg-lens-clip">
                <div ref={counterRef} className="lg-counter">
                  <div ref={cloneRowRef} className="lg-clone-row">
                    {SECTIONS.map((item) => (
                      <div
                        key={item.key}
                        className="lg-clone-tab"
                        style={{ width: TAB_W, height: TAB_H }}
                      >
                        <svg
                          width="21"
                          height="21"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {item.icon}
                        </svg>
                        <span
                          className="text-[9.5px] leading-none tracking-[0.04em]"
                          style={{ fontWeight: 600 }}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg-fallback-ca" />
              </div>
            )}

            <div className="lg-lens-spec" />
            <div ref={glowRef} className="lg-knob-glow" />
            <div className="lg-rim" />
          </div>
        </div>

        {/* Separator */}
        <div
          aria-hidden="true"
          className="relative z-10 h-7 w-px"
          style={{ background: 'var(--lg-outline)' }}
        />

        {/* WhatsApp accent button */}
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
