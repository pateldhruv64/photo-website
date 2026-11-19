'use client';

import { useState, useRef, useEffect } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import Image from 'next/image';
import type { Photo } from '@/lib/types';

/**
 * ─────────────────────────────────────────────────────────────────────
 *  3D HELIX CAROUSEL — motion.dev/ui HELIX reference match
 * ─────────────────────────────────────────────────────────────────────
 *
 *  Layout (measured from the reference screenshots)
 *  - Cards sit on ONE continuous spiral. Card k has a position "t" along it:
 *        angle = t * STEP      y = t * PITCH      (straight line, no wrap)
 *  - The spiral is longer than one turn, so back cards end up far above and
 *    below the middle. The stage clips them at the top and bottom.
 *  - Sharp corners, no shadow. Back cards are faded, not hidden.
 *
 *  Motion
 *  - AUTO-ROTATE: the spiral turns by itself, forever (loops).
 *  - DRAG: you can grab and turn it by hand at any time. After you let go,
 *    a fling glides and then settles back into the slow auto-rotation.
 *  - Auto-rotate pauses while a card is open, and is off when the
 *    visitor's system asks for reduced motion.
 *
 *  Click a card
 *  - The card grows from its place to a big centered picture, the spiral
 *    fades out, and the caption (left) and a Close button (right) appear.
 *  - Close (or Esc) shrinks it back to the same place and the spiral returns.
 */

// ─── TWEAKABLE CONSTANTS ──────────────────────────────────────────
// Spiral shape
const N = 13; // cards on the spiral (photos repeat if fewer)
const STEP = 40; // degrees between neighbouring cards
const R = 300; // spiral radius (px)
const PITCH = 68; // vertical shift per card (px)
const PERSP = 1800; // CSS perspective (px). Lower = stronger 3D
const CW = 198; // card width  (≈238 on screen at the front)
const CH = 296; // card height (≈355 on screen at the front)
const TILT = 1.2; // >1 turns side cards a little more
const CORNER = 0; // reference is sharp. Use 6 for rounded
const STAGE_W = 700; // design size of the stage (scales down on mobile)
const STAGE_H = 570;
const CLIP_Y = 12; // px cut off at top and bottom of the stage

// Motion
const AUTO_V = 0.0035; // auto-rotate speed in cards per frame (0.0035 ≈ 0.2 card/sec, one full loop ≈ 1 min). Smaller = slower
const EASE = 0.05; // how fast speed settles toward AUTO_V after a fling
const PX_PER_CARD = 180; // drag distance (stage px) that moves one card
const DRAG_THRESHOLD = 6; // px of movement before a press counts as a drag, not a click

// Open view
const OPEN_MS = 520; // open / close animation time
const OPEN_MAX_W = 380; // max width of the opened picture (smaller = smaller box)
const OPEN_RATIO = 1.15; // opened picture height / width. 1 = square, 1.3 = tall, 0.8 = wide
const FULL_W = 1000; // width of the sharp image loaded for the opened view
const CAPTION_H = 52; // space under the picture for caption + Close
const FRONT_MIN_OPACITY = 0.5; // only cards at least this visible can be clicked

const PID = [
  'portfolio/qaaf6jz6gctpbyqzutp9',
  'portfolio/o6cwxt4i8btwhlvo6bol',
  'portfolio/zfvf8tkay9zgcivad8m6',
  'portfolio/psuw3k3qbn8qiovs5wy2',
  'portfolio/jfcq6mydapftsbpxg8pq',
  'portfolio/d9n8xfghywzry13zhf0b',
  'portfolio/tfbtr4gyqnr32rcem8tz',
  'portfolio/abbx0leskyisadjwr9kh',
  'portfolio/fvas6ccy33hnakuzrtea',
  'portfolio/he1bsrd0fzezotkj13mn',
  'portfolio/l2o7gbbsbevkozo6yeee',
  'portfolio/f2l4obbcdwcmsr7qqgfi',
];

// Light image for the spiral cards. It is NOT cropped here: object-fit: cover
// does the cropping in the browser, so the same file can also be used as the
// instant first layer of the opened view (already downloaded, no wait).
function mkUrl(pid: string) {
  return `https://res.cloudinary.com/dkyonzfbo/image/upload/c_limit,w_560,q_auto:eco,f_auto/${pid}`;
}
// Sharper image, loaded only when a card is opened (or about to be)
function mkFullUrl(pid: string) {
  return `https://res.cloudinary.com/dkyonzfbo/image/upload/c_limit,w_${FULL_W},q_auto,f_auto/${pid}`;
}

// ─── LAYOUT ───────────────────────────────────────────────────────
// Keep the card's front face toward the viewer even at the back,
// so photos (faces, text) never appear mirrored.
function foldRotation(raw: number) {
  let r = ((((raw + 180) % 360) + 360) % 360) - 180;
  if (r > 90) r -= 180;
  else if (r < -90) r += 180;
  return r;
}

function layout(i: number, pos: number) {
  // t = position of this card along the spiral, centered on 0
  let t = (((i - pos) % N) + N) % N;
  if (t >= N / 2) t -= N;

  const angle = t * STEP;
  const rad = (angle * Math.PI) / 180;

  const x = R * Math.sin(rad);
  const z = R * Math.cos(rad);
  const y = t * PITCH;

  const rel = (((angle % 360) + 540) % 360) - 180;
  // positive rotateY: the outer edge of side cards goes AWAY from the viewer
  const rotY = foldRotation(rel * TILT);

  const zN = (Math.cos(rad) + 1) / 2; // 0 at the very back, 1 at the front
  const opacity = 0.22 + 0.78 * Math.pow(zN, 1.3);

  return { x, y, z, rotY, opacity };
}

// ─── TYPES ────────────────────────────────────────────────────────
type Rect = { left: number; top: number; width: number; height: number };
type OpenState = { i: number; from: Rect; startOpacity: number };

// ─── COMPONENT ────────────────────────────────────────────────────
interface Props {
  initialPhotos?: Photo[];
}

export default function HelixSection({ initialPhotos }: Props) {
  const [pos, setPos] = useState(0); // position in "cards"
  const [dragging, setDragging] = useState(false);
  const [wrapW, setWrapW] = useState(STAGE_W);
  const [open, setOpen] = useState<OpenState | null>(null);
  const [expanded, setExpanded] = useState(false); // true = big picture, false = card size
  const [helixHidden, setHelixHidden] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false); // sharp image ready in the opened view

  const scale = Math.min(1, wrapW / STAGE_W);

  const posRef = useRef(0);
  const vRef = useRef(AUTO_V); // speed in cards per frame
  const draggingRef = useRef(false);
  const pausedRef = useRef(false); // true while a card is open
  const visibleRef = useRef(true);
  const reducedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lxRef = useRef(0);
  const ltRef = useRef(0);
  const downRef = useRef<{
    x: number;
    y: number;
    idx: number | null;
    moved: boolean;
  }>({
    x: 0,
    y: 0,
    idx: null,
    moved: false,
  });
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const preloaded = useRef<Set<string>>(new Set());

  // Start downloading the sharp image early (on hover / press) so that
  // by the time the card opens it is usually already there.
  const preloadFull = (pid: string) => {
    if (preloaded.current.has(pid)) return;
    preloaded.current.add(pid);
    const img = new window.Image();
    img.decoding = 'async';
    img.src = mkFullUrl(pid);
  };

  // ── photos / titles ──
  const list = initialPhotos?.filter((p) => p?.public_id) ?? [];
  const pids = Array.from({ length: N }, (_, i) =>
    list.length ? list[i % list.length].public_id : PID[i % PID.length],
  );
  const titleOf = (i: number) => {
    if (!list.length) return `Photo ${i + 1}`;
    const rec = list[i % list.length] as unknown as Record<string, unknown>;
    const s = [rec.title, rec.caption, rec.alt, rec.name].find(
      (v) => typeof v === 'string' && v,
    );
    return (s as string | undefined) ?? `Photo ${(i % list.length) + 1}`;
  };

  // ── measure the box (for scaling on small screens) ──
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWrapW(entry.contentRect.width),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── only animate while on screen ──
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ── respect "reduce motion" ──
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      reducedRef.current = mq.matches;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // ── the one animation loop: auto-rotate + fling glide ──
  useEffect(() => {
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(3, Math.max(0, (now - last) / 16.667));
      last = now;
      if (!draggingRef.current && visibleRef.current) {
        const target = pausedRef.current || reducedRef.current ? 0 : AUTO_V;
        const k = 1 - Math.pow(1 - EASE, dt);
        vRef.current += (target - vRef.current) * k;
        if (Math.abs(vRef.current) > 1e-5) {
          posRef.current += vRef.current * dt;
          setPos(posRef.current);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  // ── open / close ──
  const rectOf = (i: number): Rect | null => {
    const el = cardEls.current[i];
    const wrap = wrapRef.current;
    if (!el || !wrap) return null;
    const r = el.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    return {
      left: r.left - w.left,
      top: r.top - w.top,
      width: r.width,
      height: r.height,
    };
  };

  const openCard = (i: number) => {
    const from = rectOf(i);
    if (!from) return;
    pausedRef.current = true;
    vRef.current = 0; // hard stop so the card does not drift
    setFullLoaded(false);
    preloadFull(pids[i]);
    timers.current.forEach(clearTimeout);
    setOpen({ i, from, startOpacity: layout(i, posRef.current).opacity });
    setExpanded(false);
    setHelixHidden(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setExpanded(true)));
  };

  const closeCard = () => {
    if (!open || !expanded) return;
    const from = rectOf(open.i);
    setOpen((o) => (o ? { ...o, from: from ?? o.from } : o));
    setExpanded(false);
    timers.current.push(
      setTimeout(() => setHelixHidden(false), OPEN_MS * 0.45),
    );
    timers.current.push(
      setTimeout(() => {
        setOpen(null);
        pausedRef.current = false; // auto-rotate resumes smoothly
      }, OPEN_MS + 30),
    );
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCard();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expanded]);

  // ── pointer: drag to turn, tap a card to open ──
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (open) return;
    const idxAttr = (e.target as HTMLElement)
      .closest('[data-card]')
      ?.getAttribute('data-card');
    downRef.current = {
      x: e.clientX,
      y: e.clientY,
      idx: idxAttr == null ? null : Number(idxAttr),
      moved: false,
    };
    if (downRef.current.idx !== null) preloadFull(pids[downRef.current.idx]);
    draggingRef.current = true;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    lxRef.current = e.clientX;
    ltRef.current = performance.now();
    vRef.current = 0;
  };

  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const d = downRef.current;
    if (
      !d.moved &&
      (Math.abs(e.clientX - d.x) > DRAG_THRESHOLD ||
        Math.abs(e.clientY - d.y) > DRAG_THRESHOLD)
    ) {
      d.moved = true;
    }
    const now = performance.now();
    const dt = Math.max(1, now - ltRef.current);
    const dx = e.clientX - lxRef.current;
    // drag left (dx < 0) -> pos goes up -> cards move left
    const dPos = -(dx / scale) / PX_PER_CARD;
    posRef.current += dPos;
    setPos(posRef.current);
    const v = (dPos / dt) * 16.67;
    vRef.current = vRef.current * 0.5 + v * 0.5; // smooth the speed
    lxRef.current = e.clientX;
    ltRef.current = now;
  };

  const endDrag = (e: RPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* */
    }
  };

  const onUp = (e: RPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    endDrag(e);
    const d = downRef.current;
    if (!d.moved) {
      vRef.current = 0;
      if (
        d.idx !== null &&
        layout(d.idx, posRef.current).opacity >= FRONT_MIN_OPACITY
      ) {
        openCard(d.idx);
      }
      return;
    }
    // pointer stopped before release -> no fling
    if (performance.now() - ltRef.current > 80) vRef.current = 0;
  };

  const onHover = (e: RPointerEvent<HTMLDivElement>) => {
    if (open || draggingRef.current) return;
    const a = (e.target as HTMLElement)
      .closest('[data-card]')
      ?.getAttribute('data-card');
    if (a != null) preloadFull(pids[Number(a)]);
  };

  const onCancel = (e: RPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    endDrag(e);
  };

  // ── cards ──
  const cards = pids
    .map((pid, i) => ({ i, pid, url: mkUrl(pid), ...layout(i, pos) }))
    .sort((a, b) => a.z - b.z);

  // ── opened picture position ──
  const wrapH = STAGE_H * scale;
  const tw = Math.min(wrapW - 32, OPEN_MAX_W);
  const th = Math.min(tw * OPEN_RATIO, wrapH - CAPTION_H - 24);
  const target: Rect = {
    left: (wrapW - tw) / 2,
    top: Math.max(12, (wrapH - CAPTION_H - th) / 2),
    width: tw,
    height: th,
  };
  const box: Rect = open && !expanded ? open.from : target;
  const ease = 'cubic-bezier(0.22, 0.8, 0.2, 1)';

  return (
    <section
      id="helix-section"
      aria-label="3D Helix Gallery"
      className="relative overflow-hidden select-none"
      style={{ background: '#f5f5f7' }}
    >
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-6 md:py-10">
        <div className="mb-3 text-center">
          <p className="eyebrow justify-center mb-1 text-accent-deep">
            Spatial Gallery
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-light text-ink">
            Visual{' '}
            <span className="italic font-normal font-serif text-accent-deep">
              Chronicles
            </span>
          </h2>
        </div>

        {/* Outer box: scaled size, handles drag and tap */}
        <div
          ref={wrapRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onCancel}
          onPointerOver={onHover}
          className={`relative mx-auto w-full touch-none ${
            open ? '' : dragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ maxWidth: STAGE_W, height: wrapH }}
        >
          {/* Stage: fixed design size, scaled to fit, clipped top and bottom */}
          <div
            style={{
              width: STAGE_W,
              height: STAGE_H,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              perspective: `${PERSP}px`,
              perspectiveOrigin: '50% 50%',
              clipPath: `inset(${CLIP_Y}px 0 ${CLIP_Y}px 0)`,
              opacity: helixHidden ? 0 : 1,
              transition: 'opacity 350ms ease',
              pointerEvents: open ? 'none' : 'auto',
            }}
          >
            <div
              className="absolute left-1/2 top-1/2"
              style={{ width: 0, height: 0, transformStyle: 'preserve-3d' }}
            >
              {cards.map((c) => (
                <div
                  key={c.i}
                  data-card={c.i}
                  ref={(el) => {
                    cardEls.current[c.i] = el;
                  }}
                  style={{
                    position: 'absolute',
                    width: CW,
                    height: CH,
                    left: -CW / 2,
                    top: -CH / 2,
                    opacity: c.opacity,
                    transform: `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, ${c.z.toFixed(1)}px) rotateY(${c.rotY.toFixed(1)}deg)`,
                    willChange: 'transform, opacity',
                    borderRadius: CORNER,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={c.url}
                    alt={titleOf(c.i)}
                    fill
                    className="object-cover pointer-events-none"
                    sizes="240px"
                    priority={c.i < 3}
                    unoptimized
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Opened view */}
          {open && (
            <div className="absolute inset-0 z-10">
              <div
                style={{
                  position: 'absolute',
                  left: box.left,
                  top: box.top,
                  width: box.width,
                  height: box.height,
                  overflow: 'hidden',
                  background: '#e6e8ec', // never an empty box while loading
                  willChange: 'left, top, width, height',
                  borderRadius: CORNER,
                  opacity: expanded ? 1 : open.startOpacity,
                  transition: `left ${OPEN_MS}ms ${ease}, top ${OPEN_MS}ms ${ease}, width ${OPEN_MS}ms ${ease}, height ${OPEN_MS}ms ${ease}, opacity ${OPEN_MS}ms ease`,
                }}
              >
                {/* layer 1: the card's own image, already downloaded, so the animation always plays */}
                <Image
                  src={mkUrl(pids[open.i])}
                  alt={titleOf(open.i)}
                  fill
                  className="object-cover pointer-events-none"
                  sizes="380px"
                  unoptimized
                  draggable={false}
                />
                {/* layer 2: sharp image, fades in when it has loaded */}
                <Image
                  src={mkFullUrl(pids[open.i])}
                  alt=""
                  fill
                  className="object-cover pointer-events-none"
                  style={{
                    opacity: fullLoaded ? 1 : 0,
                    transition: 'opacity 300ms ease',
                  }}
                  sizes="380px"
                  unoptimized
                  draggable={false}
                  onLoad={() => setFullLoaded(true)}
                />
              </div>

              <div
                style={{
                  position: 'absolute',
                  left: target.left,
                  width: target.width,
                  top: target.top + target.height + 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  opacity: expanded ? 1 : 0,
                  transition: expanded
                    ? `opacity 260ms ease ${OPEN_MS * 0.5}ms`
                    : 'opacity 160ms ease',
                  pointerEvents: expanded ? 'auto' : 'none',
                }}
              >
                <span className="font-mono uppercase tracking-wide text-[13px] text-ink">
                  {titleOf(open.i)}
                </span>
                <button
                  type="button"
                  onClick={closeCard}
                  className="font-mono text-[13px] text-ink px-4 py-2 border border-black/10 bg-white/60 hover:bg-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
