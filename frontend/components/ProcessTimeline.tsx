'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Step {
  number: string;
  short: string; // film-strip tile label
  phase: string;
  title: string;
  description: string;
  tags: string[];
  meta: string; // LCD ki doosri line
  paths: string[]; // icon svg paths
}

const STEPS: Step[] = [
  {
    number: '01',
    short: 'Consult',
    phase: 'Initial vision',
    title: 'Consultation & Moodboard',
    description:
      'We delve into your story, visual aesthetic, and desired atmosphere — curating a bespoke moodboard, color palette, and location scout.',
    tags: ['Storyboard', 'Palette', 'Wardrobe advisory'],
    meta: 'The idea',
    paths: [
      'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    ],
  },
  {
    number: '02',
    short: 'Plan',
    phase: 'Creative blueprint',
    title: 'Creative Planning & Staging',
    description:
      'Every minute detail mapped with precision — lighting setup, call sheets, prop arrangements, and contingency weather plans.',
    tags: ['Lighting schematics', 'Call sheet', 'Run of show'],
    meta: 'ISO 100',
    paths: [
      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    ],
  },
  {
    number: '03',
    short: 'Shoot',
    phase: 'Production',
    title: 'The Editorial Shoot',
    description:
      'Where artistry and emotion meet. Guided with effortless, natural direction to capture authentic cinematic moments and raw emotional depth.',
    tags: ['14-bit RAW', 'High-speed tethering'],
    meta: '1/500s',
    paths: [
      'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
      'M15 13a3 3 0 11-6 0 3 3 0 016 0z',
    ],
  },
  {
    number: '04',
    short: 'Grade',
    phase: 'Mastering',
    title: 'Post-Production & Color Grading',
    description:
      'Frame-by-frame 16-bit color mastery, frequency separation skin retouching, and bespoke film emulation for a magazine-grade signature look.',
    tags: ['Frequency separation', 'Film curves', '16-bit pro'],
    meta: 'DCI-P3 · 16-bit',
    paths: [
      'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
    ],
  },
  {
    number: '05',
    short: 'Deliver',
    phase: 'Archive & delivery',
    title: 'Private Vault & Print Delivery',
    description:
      'Your private cloud gallery is unlocked with PIN security, full-resolution downloads, and archival fine-art museum print selections.',
    tags: ['PIN-encrypted vault', 'Zero-compression TIFF'],
    meta: 'Archival master',
    paths: [
      'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    ],
  },
];

const N = STEPS.length;
const AUTOPLAY_MS = 6500;

/* ═══════════════════════════════════════════════════════════════════
   APERTURE LENS
   Asli lens jaisa: metal barrel, knurled grip, f-number ring jo ghoomti hai,
   9 overlapping iris blades, aur opening ke andar tera photo.
   Stage badhne par iris khulta hai aur photo "focus pull" + colour grade hota hai:
   out-of-focus idea → sharp RAW → graded → final.
   ═══════════════════════════════════════════════════════════════════ */

const C = 100; // viewBox center (200 x 200)
const AP_R = 68; // aperture radius
const BLADES = 9;

// Iris opening (apothem / AP_R) har stage ke liye
const OPEN = [0.36, 0.46, 0.58, 0.76, 0.95];

// f-number ring: 9 stops, 22° gap. Stage 1..5 => 16, 8, 4, 2, 1.2
const STOPS = [16, 11, 8, 5.6, 4, 2.8, 2, 1.4, 1.2];
const STOP_GAP = 22;

// Photo ka "focus pull + grade" har stage pe. Har string me same functions, same order
// (tabhi CSS smoothly interpolate karta hai).
const photoFilter = (
  blur: number,
  gray: number,
  contrast: number,
  sat: number,
  bright: number,
) =>
  `blur(${blur}px) grayscale(${gray}) contrast(${contrast}) saturate(${sat}) brightness(${bright})`;
const PHOTO_FILTERS = [
  photoFilter(10, 1, 1, 1, 0.55), // 01 vision: dhundhla, B/W
  photoFilter(5, 0.9, 0.95, 1, 0.65), // 02 plan: focus aa raha hai
  photoFilter(0, 0.8, 0.85, 1, 0.8), // 03 shoot: sharp par flat RAW
  photoFilter(0, 0.25, 1.12, 1.25, 0.95), // 04 grade: colour aa raha hai
  photoFilter(0, 0, 1.06, 1.1, 1), // 05 deliver: final
];
const PHOTO_SCALES = [1.25, 1.18, 1.1, 1.05, 1];

// Tera apna portfolio photo (props se override ho sakta hai)
const DEFAULT_LENS_PHOTO =
  'https://res.cloudinary.com/dkyonzfbo/image/upload/v1783573813/portfolio/f70rmdumjwbcye0d6zn1.jpg';

const lerpArr = (arr: number[], p: number) => {
  const i = Math.max(0, Math.min(arr.length - 1, Math.floor(p)));
  const j = Math.min(arr.length - 1, i + 1);
  return arr[i] + (arr[j] - arr[i]) * (p - i);
};

// f-number ko stops ke hisaab se "tick" karwane ke liye (16 → 11 → 8 → 5.6 ...)
const nearestStop = (p: number) => {
  const f = Math.exp(
    Math.log(16) + (Math.log(1.2) - Math.log(16)) * (p / (OPEN.length - 1)),
  );
  let best = STOPS[0];
  for (const s of STOPS) {
    if (
      Math.abs(Math.log(s) - Math.log(f)) <
      Math.abs(Math.log(best) - Math.log(f))
    )
      best = s;
  }
  return best;
};

/** p ko target tak smoothly le jaata hai (iris ke liye, JS se, kyunki geometry badalti hai) */
function useTween(target: number, ms: number) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);

  useEffect(() => {
    if (valueRef.current === target) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      valueRef.current = target;
      setValue(target);
      return;
    }
    const from = valueRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 4);
      const v = from + (target - from) * eased;
      valueRef.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return value;
}

/** Ek iris blade: opening polygon ki ek side ke bahar wali strip, pinwheel tail ke saath */
function bladeGeometry(i: number, d: number) {
  const a = ((i * 360) / BLADES - 90) * (Math.PI / 180);
  const nx = Math.cos(a);
  const ny = Math.sin(a);
  const tx = -ny;
  const ty = nx;
  const h = d * Math.tan(Math.PI / BLADES);
  const pt = (t: number, u: number): [number, number] => [
    C + t * tx + u * nx,
    C + t * ty + u * ny,
  ];
  const uOut = AP_R + 16;
  const poly = [
    pt(-h - 3, d),
    pt(h + 26, d),
    pt(h + 34, uOut),
    pt(-h - 7, uOut),
  ];
  return {
    points: poly.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' '),
    edgeA: pt(-h - 3, d),
    edgeB: pt(h, d),
    gradFrom: pt(0, d),
    gradTo: pt(0, d + 30),
  };
}

// Barrel ke grip ke knurl lines (static)
const KNURL = Array.from({ length: 120 }, (_, i) => {
  const a = (i * 3 * Math.PI) / 180;
  return {
    x1: C + 88.5 * Math.cos(a),
    y1: C + 88.5 * Math.sin(a),
    x2: C + 95 * Math.cos(a),
    y2: C + 95 * Math.sin(a),
  };
});

export function BarrelSvg({ ring }: { ring: number }) {
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="proc-barrel" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#4a586a" />
          <stop offset="0.35" stopColor="#1a222c" />
          <stop offset="0.65" stopColor="#0a1016" />
          <stop offset="1" stopColor="#2f3a47" />
        </linearGradient>
      </defs>

      {/* Outer barrel */}
      <circle cx={C} cy={C} r="99" fill="url(#proc-barrel)" />
      <circle
        cx={C}
        cy={C}
        r="98.4"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="0.8"
      />
      {/* Grip */}
      <circle cx={C} cy={C} r="96" fill="#0c1218" />
      {KNURL.map((k, i) => (
        <line
          key={i}
          {...k}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.1"
        />
      ))}
      <circle
        cx={C}
        cy={C}
        r="88"
        fill="#111922"
        stroke="rgba(0,0,0,0.6)"
        strokeWidth="1"
      />

      {/* f-number ring (ghoomti hai) */}
      <g transform={`rotate(${ring} ${C} ${C})`}>
        {STOPS.map((s, k) => (
          <text
            key={s}
            x={C}
            y={C - 78}
            textAnchor="middle"
            transform={`rotate(${k * STOP_GAP} ${C} ${C})`}
            fill="rgba(255,255,255,0.72)"
            fontSize="7"
            fontWeight="500"
          >
            {s}
          </text>
        ))}
        {STOPS.map((s, k) => (
          <circle
            key={`d-${s}`}
            cx={C}
            cy={C - 71.5}
            r="0.8"
            fill="rgba(255,255,255,0.4)"
            transform={`rotate(${k * STOP_GAP} ${C} ${C})`}
          />
        ))}
      </g>

      {/* Fixed index mark */}
      <polygon
        points={`${C},${C - 86.5} ${C - 2.6},${C - 91.5} ${C + 2.6},${C - 91.5}`}
        fill="#f2f5f8"
      />

      {/* Bezel */}
      <circle cx={C} cy={C} r="76" fill="#05090d" />
      <circle
        cx={C}
        cy={C}
        r="76"
        fill="none"
        stroke="rgba(118,159,205,0.5)"
        strokeWidth="0.7"
      />
    </svg>
  );
}

export function BladesSvg({ d }: { d: number }) {
  const blades = Array.from({ length: BLADES }, (_, i) => bladeGeometry(i, d));
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
      <defs>
        <clipPath id="proc-ap-clip">
          <circle cx={C} cy={C} r={AP_R} />
        </clipPath>
        {blades.map((b, i) => (
          <linearGradient
            key={i}
            id={`proc-blade-${i}`}
            gradientUnits="userSpaceOnUse"
            x1={b.gradFrom[0]}
            y1={b.gradFrom[1]}
            x2={b.gradTo[0]}
            y2={b.gradTo[1]}
          >
            <stop offset="0" stopColor="#4d5c70" />
            <stop offset="0.45" stopColor="#202a36" />
            <stop offset="1" stopColor="#0c1218" />
          </linearGradient>
        ))}
        <linearGradient id="proc-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g clipPath="url(#proc-ap-clip)">
        {blades.map((b, i) => (
          <g key={i}>
            <polygon
              points={b.points}
              fill={`url(#proc-blade-${i})`}
              stroke="rgba(0,0,0,0.65)"
              strokeWidth="0.6"
              strokeLinejoin="round"
            />
            <line
              x1={b.edgeA[0]}
              y1={b.edgeA[1]}
              x2={b.edgeB[0]}
              y2={b.edgeB[1]}
              stroke="rgba(255,255,255,0.38)"
              strokeWidth="0.5"
              strokeLinecap="round"
            />
          </g>
        ))}
        {/* Glass reflection */}
        <ellipse
          cx="82"
          cy="72"
          rx="46"
          ry="22"
          transform={`rotate(-35 ${C} ${C})`}
          fill="url(#proc-glass)"
        />
      </g>

      {/* Aperture ka dark rim */}
      <circle
        cx={C}
        cy={C}
        r={AP_R + 1}
        fill="none"
        stroke="#000"
        strokeOpacity="0.8"
        strokeWidth="2.4"
      />
    </svg>
  );
}

interface LensProps {
  stage: number;
  metas: string[];
  photoUrl?: string;
}

function ApertureLens({
  stage,
  metas,
  photoUrl = DEFAULT_LENS_PHOTO,
}: LensProps) {
  const p = useTween(stage, 1000);
  const [imgOk, setImgOk] = useState(true);

  const d = AP_R * lerpArr(OPEN, p);
  const ring = -(p * 2) * STOP_GAP; // stage 1..5 => label index 0,2,4,6,8
  const label = nearestStop(p);

  return (
    <>
      <div
        aria-hidden="true"
        className="relative h-32 w-32 flex-shrink-0 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_70px_rgba(118,159,205,0.12)] sm:h-36 sm:w-36 md:h-64 md:w-64 lg:h-72 lg:w-72"
      >
        <BarrelSvg ring={ring} />

        {/* Photo: sirf iris ke opening se dikhta hai */}
        <div className="absolute inset-[16%] overflow-hidden rounded-full bg-[#05090d]">
          {imgOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              draggable={false}
              decoding="async"
              onError={() => setImgOk(false)}
              className="proc-lens-photo h-full w-full select-none object-cover"
              style={{
                filter: PHOTO_FILTERS[stage],
                transform: `scale(${PHOTO_SCALES[stage]})`,
                transition:
                  'filter 1000ms ease, transform 1200ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          ) : (
            <div
              className="proc-lens-photo h-full w-full bg-gradient-to-br from-[#769fcd] to-[#142433]"
              style={{
                filter: PHOTO_FILTERS[stage],
                transition: 'filter 1000ms ease',
              }}
            />
          )}
        </div>

        <BladesSvg d={d} />
      </div>

      {/* Camera LCD: f-number live tick karta hai jaise iris khulta hai */}
      <div
        className="min-w-0 flex-1 md:flex-none md:text-center"
        aria-hidden="true"
      >
        <p className="font-mono text-3xl tabular-nums text-accent-tint md:text-4xl">
          ƒ/{label}
        </p>
        <div className="mt-1 grid">
          {metas.map((m, i) => (
            <p
              key={m}
              className={`proc-panel col-start-1 row-start-1 font-body text-xs text-white/55 transition-[opacity,visibility] duration-500 sm:text-sm ${
                i === stage ? 'visible opacity-100' : 'invisible opacity-0'
              }`}
            >
              Stage {i + 1} of {metas.length} · {m}
            </p>
          ))}
        </div>
      </div>
    </>
  );
}

export default function ProcessTimeline({
  photoUrl,
}: { photoUrl?: string } = {}) {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [inView, setInView] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  // User ne control le liya => autoplay band
  const select = useCallback((i: number) => {
    setActive(i);
    setAutoplay(false);
  }, []);

  // Sirf screen pe dikhe tab chalao
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      {
        threshold: 0.35,
      },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // prefers-reduced-motion => autoplay nahi
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      setAutoplay(false);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    let next = active;
    if (e.key === 'ArrowRight') next = (active + 1) % N;
    else if (e.key === 'ArrowLeft') next = (active - 1 + N) % N;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = N - 1;
    else return;
    e.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  };

  // Mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touchRef.current;
    touchRef.current = null;
    if (!s) return;
    const dx = e.changedTouches[0].clientX - s.x;
    const dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      select(dx < 0 ? (active + 1) % N : (active - 1 + N) % N);
    }
  };

  const paused = hovering || !inView;

  return (
    <section
      ref={sectionRef}
      id="process-section"
      aria-labelledby="process-heading"
      className="relative overflow-hidden bg-[#0A121A] py-10 text-white md:py-14"
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-accent-deep/12 blur-[140px]"
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="mb-6 flex flex-col items-center text-center md:mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-4 py-1.5 backdrop-blur-[6px]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-tint" />
            <span className="font-body text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-soft">
              The Creative Journey
            </span>
          </div>

          <h2
            id="process-heading"
            className="font-display text-3xl font-light tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            From vision to{' '}
            <span className="font-serif font-normal italic text-accent-tint">
              timeless archive
            </span>
          </h2>
          <p className="mt-3 max-w-md font-body text-xs text-white/70 sm:text-sm">
            Five stages, one uncompromising process. Tap a stage to see what
            happens inside it.
          </p>
        </div>

        {/* ── Film strip selector ── */}
        <div
          role="tablist"
          aria-label="Process stages"
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          className="relative grid grid-cols-5 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] shadow-[0_12px_32px_rgba(0,0,0,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.25)] backdrop-blur-[6px]"
        >
          {/* Sprocket holes */}
          {(['top-[3px]', 'bottom-[6px]'] as const).map((pos) => (
            <div
              key={pos}
              aria-hidden="true"
              className={`pointer-events-none absolute left-0 right-0 h-[5px] ${pos}`}
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.2) 1.4px, transparent 1.6px)',
                backgroundSize: '14px 5px',
                backgroundPosition: 'center',
              }}
            />
          ))}

          {STEPS.map((step, i) => {
            const isActive = i === active;
            return (
              <button
                key={step.number}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={`process-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`process-panel-${i}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => select(i)}
                className={`relative flex flex-col items-center gap-1 px-1 pb-5 pt-6 outline-none transition-colors duration-300 focus-visible:bg-white/[0.1] md:gap-1.5 md:pb-6 md:pt-7 ${
                  i > 0 ? 'border-l border-white/10' : ''
                } ${isActive ? 'bg-white/[0.09]' : 'hover:bg-white/[0.05]'}`}
              >
                <svg
                  className={`h-5 w-5 transition-all duration-500 md:h-6 md:w-6 ${
                    isActive ? 'scale-110 text-accent-tint' : 'text-white/50'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  aria-hidden="true"
                >
                  {step.paths.map((d) => (
                    <path
                      key={d}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={d}
                    />
                  ))}
                </svg>
                <span
                  className={`font-body text-[11px] transition-colors duration-300 md:text-sm ${
                    isActive ? 'font-medium text-white' : 'text-white/55'
                  }`}
                >
                  {step.short}
                </span>

                {/* Progress bar: autoplay me animate, warna full */}
                {isActive &&
                  (autoplay ? (
                    <span
                      key={`p-${active}`}
                      aria-hidden="true"
                      className="proc-progress absolute bottom-0 left-0 h-[2px] w-full bg-accent-tint"
                      style={{
                        animationDuration: `${AUTOPLAY_MS}ms`,
                        animationPlayState: paused ? 'paused' : 'running',
                      }}
                      onAnimationEnd={() => setActive((a) => (a + 1) % N)}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 h-[2px] w-full bg-accent-tint"
                    />
                  ))}
              </button>
            );
          })}
        </div>

        {/* ── Stage ── */}
        <div
          onPointerEnter={(e) => e.pointerType === 'mouse' && setHovering(true)}
          onPointerLeave={(e) =>
            e.pointerType === 'mouse' && setHovering(false)
          }
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="mt-6 grid items-center gap-5 md:mt-8 md:grid-cols-12 md:gap-10"
          style={{ touchAction: 'pan-y' }}
        >
          {/* Left: asli lens. Iris khulta hai, f-ring ghoomti hai, photo focus + grade hota hai */}
          <div className="flex items-center gap-5 md:col-span-5 md:flex-col md:gap-4">
            <ApertureLens
              stage={active}
              metas={STEPS.map((s) => s.meta)}
              photoUrl={photoUrl}
            />
          </div>

          {/* Right: stage content. Sab panels ek jagah stack => section ki height fixed rehti hai */}
          <div className="grid md:col-span-7">
            {STEPS.map((step, i) => {
              const on = i === active;
              return (
                <div
                  key={step.number}
                  id={`process-panel-${i}`}
                  role="tabpanel"
                  aria-labelledby={`process-tab-${i}`}
                  aria-hidden={!on}
                  className={`proc-panel col-start-1 row-start-1 transition-[opacity,transform,visibility] duration-500 ${
                    on
                      ? 'visible translate-y-0 opacity-100'
                      : 'pointer-events-none invisible translate-y-2 opacity-0'
                  }`}
                >
                  <p className="flex items-center gap-3 font-body text-xs text-accent-soft sm:text-sm">
                    <span className="font-display text-3xl font-light leading-none text-white/25 sm:text-4xl">
                      {step.number}
                    </span>
                    <span className="h-px w-8 bg-white/20" />
                    <span>{step.phase}</span>
                  </p>

                  <h3 className="mt-4 font-display text-2xl font-light text-white sm:text-3xl md:text-4xl">
                    {step.title}
                  </h3>

                  <p className="mt-3 max-w-lg font-body text-sm leading-relaxed text-white/70 md:text-base">
                    {step.description}
                  </p>

                  <ul className="mt-5 flex flex-wrap gap-2">
                    {step.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 font-body text-[11px] text-white/70 backdrop-blur-[4px] sm:text-xs"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes procProgress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .proc-progress {
          transform-origin: left center;
          animation-name: procProgress;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .proc-lens-photo, .proc-panel { transition: none !important; }
        }
      `}</style>
    </section>
  );
}
