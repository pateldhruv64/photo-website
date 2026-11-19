'use client';

import { useState } from 'react';

interface StepItem {
  number: string;
  phase: string;
  title: string;
  description: string;
  techMeta: string;
  aperture: string;
  icon: (active: boolean) => React.ReactNode;
}

const STEPS: StepItem[] = [
  {
    number: '01',
    phase: 'INITIAL VISION',
    title: 'Consultation & Moodboard',
    description:
      'We delve into your story, visual aesthetic, and desired atmosphere — curating a bespoke moodboard, color palette, and location scout.',
    techMeta: 'STORYBOARD · PALETTE · WARDROBE ADVISORY',
    aperture: 'ƒ/1.2 EXP',
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform duration-500 ${active ? 'scale-115 text-accent-tint' : 'text-accent-soft'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  {
    number: '02',
    phase: 'CREATIVE BLUEPRINT',
    title: 'Creative Planning & Staging',
    description:
      'Every minute detail mapped with precision — lighting setup, call sheets, prop arrangements, and contingency weather plans.',
    techMeta: 'LIGHTING SCHEMATICS · CALL SHEET · RUN OF SHOW',
    aperture: 'ƒ/2.0 ISO 100',
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform duration-500 ${active ? 'scale-115 text-accent-tint' : 'text-accent-soft'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    number: '03',
    phase: 'PRODUCTION',
    title: 'The Editorial Shoot',
    description:
      'Where artistry and emotion meet. Guided with effortless, natural direction to capture authentic cinematic moments and raw emotional depth.',
    techMeta: '14-BIT RAW SENSOR · HIGH-SPEED TETHERING',
    aperture: 'ƒ/1.4 SHUTTER 1/500s',
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform duration-500 ${active ? 'scale-115 text-accent-tint' : 'text-accent-soft'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    number: '04',
    phase: 'MASTERING',
    title: 'Post-Production & Color Grading',
    description:
      'Frame-by-frame 16-bit color mastery, frequency separation skin retouching, and bespoke film emulation for a magazine-grade signature look.',
    techMeta: 'FREQUENCY SEPARATION · FILM CURVES · 16-BIT PRO',
    aperture: 'DCI-P3 16-BIT',
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform duration-500 ${active ? 'scale-115 text-accent-tint' : 'text-accent-soft'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
    ),
  },
  {
    number: '05',
    phase: 'ARCHIVE & DELIVERY',
    title: 'Private Vault & Print Delivery',
    description:
      'Your private cloud gallery is unlocked with PIN security, full-resolution downloads, and archival fine-art museum print selections.',
    techMeta: 'PIN-ENCRYPTED VAULT · ZERO-COMPRESSION TIFF',
    aperture: 'ARCHIVAL MASTER',
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform duration-500 ${active ? 'scale-115 text-accent-tint' : 'text-accent-soft'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
];

export default function ProcessTimeline() {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section
      id="process-section"
      aria-labelledby="process-heading"
      className="relative overflow-hidden bg-[#0A121A] py-20 text-white md:py-28"
    >
      {/* ── Ambient Studio Optical Glows ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 h-[550px] w-[850px] rounded-full bg-accent-deep/12 blur-[150px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-1/4 h-[400px] w-[600px] rounded-full bg-white/5 blur-[120px]"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-4 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.3),inset_0_1px_1.5px_rgba(255,255,255,0.4)] backdrop-blur-[6px] mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-tint animate-pulse" />
            <span className="font-body text-[11px] font-semibold tracking-[0.24em] text-accent-soft uppercase">
              The Creative Journey
            </span>
          </div>

          <h2
            id="process-heading"
            className="font-display text-3xl font-light tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            From Vision to <span className="italic font-normal font-serif text-accent-tint">Timeless Archive</span>
          </h2>
          <p className="mt-3.5 max-w-md font-body text-xs sm:text-sm text-white/70">
            Every bespoke commission follows an uncompromising editorial process designed for precision. Click any stage to inspect.
          </p>
        </div>

        {/* ── Timeline Sequence Container ── */}
        <div className="relative">
          {/* Desktop Central Spine with Liquid Glass Light Trace */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-white/15 to-transparent"
          >
            {/* Liquid Light Photon Drop traveling continuously */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-1 h-32 rounded-full bg-gradient-to-b from-transparent via-accent-tint to-transparent blur-[0.5px]"
              style={{
                animation: 'photonGlide 4s cubic-bezier(0.45, 0, 0.55, 1) infinite',
              }}
            />
          </div>

          {/* Mobile Left Spine */}
          <div
            aria-hidden="true"
            className="md:hidden absolute left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-white/15 to-transparent"
          />

          <ol className="space-y-10 md:space-y-0">
            {STEPS.map((step, idx) => {
              const isEven = idx % 2 === 0;
              const isHovered = hoveredIdx === idx;
              const isSelected = selectedIdx === idx;
              const active = isHovered || isSelected;

              return (
                <li
                  key={step.number}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setSelectedIdx(idx)}
                  className={`relative flex flex-col md:flex-row md:items-center md:gap-12 ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  } py-4 md:py-8 cursor-pointer select-none`}
                >
                  {/* Step Card — Apple Optical Glass Lens Slab */}
                  <div
                    className={`pl-14 md:pl-0 md:w-[calc(50%-3rem)] ${
                      isEven ? 'md:text-right' : 'md:text-left'
                    }`}
                  >
                    <div
                      className={`group relative overflow-hidden rounded-[1.8rem] border p-6 sm:p-8 backdrop-blur-[6px] transition-all duration-500 ${
                        active
                          ? 'border-white/50 bg-white/[0.12] shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.7),inset_0_-1px_1.5px_rgba(255,255,255,0.2)] -translate-y-1 scale-[1.02]'
                          : 'border-white/15 bg-white/[0.05] shadow-[0_12px_32px_rgba(0,0,0,0.4),inset_0_1px_1.5px_rgba(255,255,255,0.35)] hover:border-white/30 hover:bg-white/[0.08]'
                      }`}
                    >
                      {/* Viewfinder Camera Reticle Brackets (4 corners) */}
                      <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-3 transition-opacity duration-400 ${
                          active ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <span className="absolute left-0 top-0 h-2.5 w-2.5 border-l-2 border-t-2 border-accent-tint" />
                        <span className="absolute right-0 top-0 h-2.5 w-2.5 border-r-2 border-t-2 border-accent-tint" />
                        <span className="absolute bottom-0 left-0 h-2.5 w-2.5 border-b-2 border-l-2 border-accent-tint" />
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 border-b-2 border-r-2 border-accent-tint" />
                      </div>

                      {/* Step Phase & Technical Aperture Tag */}
                      <div
                        className={`relative z-10 flex items-center gap-2 mb-3 ${
                          isEven ? 'md:justify-end' : 'md:justify-start'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-accent-soft backdrop-blur-[4px]">
                          <span className="h-1 w-1 rounded-full bg-accent-tint" />
                          STEP {step.number} · {step.phase}
                        </span>
                        <span className="font-mono text-[9px] text-white/40 tracking-wider">
                          {step.aperture}
                        </span>
                      </div>

                      {/* Step Title */}
                      <h3
                        className={`relative z-10 font-display text-xl sm:text-2xl font-light mb-2.5 transition-colors duration-300 ${
                          active ? 'text-accent-tint' : 'text-white'
                        }`}
                      >
                        {step.title}
                      </h3>

                      {/* Step Description */}
                      <p className="relative z-10 font-body text-xs sm:text-sm leading-relaxed text-white/70">
                        {step.description}
                      </p>

                      {/* Technical Meta HUD Strip */}
                      <div
                        className={`relative z-10 mt-5 pt-3 border-t border-white/10 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-white/45 ${
                          isEven ? 'md:justify-end' : 'md:justify-start'
                        }`}
                      >
                        <span className="h-1 w-1 rounded-full bg-accent-soft" />
                        <span>{step.techMeta}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Desktop Center Leica Optical Glass Lens Node ── */}
                  <div
                    aria-hidden="true"
                    className={`hidden md:flex absolute left-1/2 -translate-x-1/2 h-14 w-14 rounded-full items-center justify-center z-20 backdrop-blur-[8px] transition-all duration-500 ${
                      active
                        ? 'border border-accent-tint bg-white/[0.18] text-white shadow-[0_0_32px_rgba(118,159,205,0.65),inset_0_1.5px_2px_rgba(255,255,255,0.9)] scale-110 animate-water-wobble'
                        : 'border border-white/25 bg-black/40 text-accent-soft shadow-[0_6px_20px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.4)] hover:border-white/50'
                    }`}
                  >
                    {/* Concentric Optical Glass Aperture Ring */}
                    <div
                      className={`absolute inset-0 rounded-full border border-accent-tint/40 transition-transform duration-700 ${
                        active ? 'scale-125 opacity-100' : 'scale-100 opacity-0'
                      }`}
                    />
                    {step.icon(active)}
                  </div>

                  {/* ── Mobile Left Lens Node ── */}
                  <div
                    aria-hidden="true"
                    className={`md:hidden absolute left-6 -translate-x-1/2 top-6 h-11 w-11 rounded-full flex items-center justify-center z-20 border backdrop-blur-[6px] transition-all duration-300 ${
                      active
                        ? 'border-accent-tint bg-white/[0.18] text-white shadow-[0_0_20px_rgba(118,159,205,0.5),inset_0_1.5px_2px_rgba(255,255,255,0.85)]'
                        : 'border-white/25 bg-black/50 text-accent-soft'
                    }`}
                  >
                    {step.icon(active)}
                  </div>

                  {/* Desktop Layout Counter-weight Spacer */}
                  <div className="hidden md:block md:w-[calc(50%-3rem)]" />
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* ── Keyframe Animations for Spine Photon & Liquid Wobble ── */}
      <style jsx>{`
        @keyframes photonGlide {
          0% {
            top: -10%;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            top: 105%;
            opacity: 0;
          }
        }
        @keyframes waterWobble {
          0% {
            transform: translate(-50%, 0) scale(1.15, 0.88);
          }
          30% {
            transform: translate(-50%, 0) scale(0.92, 1.12);
          }
          55% {
            transform: translate(-50%, 0) scale(1.06, 0.96);
          }
          75% {
            transform: translate(-50%, 0) scale(0.98, 1.02);
          }
          100% {
            transform: translate(-50%, 0) scale(1.1, 1.1);
          }
        }
        .animate-water-wobble {
          animation: waterWobble 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </section>
  );
}
