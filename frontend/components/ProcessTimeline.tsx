'use client';

import { useState } from 'react';

interface StepItem {
  number: string;
  phase: string;
  title: string;
  description: string;
  techMeta: string;
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
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform duration-500 ease-editorial ${active ? 'scale-110' : ''}`}
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
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform duration-500 ease-editorial ${active ? 'scale-110' : ''}`}
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
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform duration-500 ease-editorial ${active ? 'scale-110' : ''}`}
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
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform duration-500 ease-editorial ${active ? 'scale-110' : ''}`}
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
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform duration-500 ease-editorial ${active ? 'scale-110' : ''}`}
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

/**
 * ─────────────────────────────────────────────────────────────────────
 *  BESPOKE PROCESS TIMELINE (Light-Tracing Path & Aperture Nodes)
 * ─────────────────────────────────────────────────────────────────────
 *  - Active Luminous Exposure Beam traveling down the connecting path.
 *  - Optical Shutter Lens Nodes with Aperture Ring expansion on hover.
 *  - Viewfinder Corner Tick-Marks on cards matching site-wide camera motif.
 *  - Connected mobile spine ensuring seamless storytelling on all devices.
 *  - Full semantic <ol> structure & WCAG AAA contrast compliance.
 */
export default function ProcessTimeline() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden bg-ink py-20 text-white md:py-28">
      {/* Studio Ambient Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-accent-deep/10 blur-[140px]"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-16 flex flex-col items-center text-center">
          <p className="eyebrow mb-2 justify-center text-accent-soft">
            The Creative Journey
          </p>
          <h2 className="font-display text-3xl font-light tracking-tight text-white sm:text-4xl md:text-5xl">
            From Vision to Timeless Archive
          </h2>
          <p className="mt-3.5 max-w-md font-body text-sm text-white/70 sm:text-base">
            Every bespoke commission follows an uncompromising editorial process designed for
            perfection.
          </p>
          <div className="divider-line mx-auto mt-6 max-w-[80px] bg-accent-soft/40" />
        </div>

        {/* Timeline Sequence */}
        <div className="relative">
          {/* Desktop Central Spine with Continuous Light Trace */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/20 to-transparent"
          >
            {/* Luminous Pulsing Exposure Beam */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-36 bg-gradient-to-b from-transparent via-accent to-transparent blur-[0.5px] animate-shimmer" />
          </div>

          {/* Mobile Continuous Left Spine */}
          <div
            aria-hidden="true"
            className="md:hidden absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"
          />

          <ol className="space-y-10 md:space-y-0">
            {STEPS.map((step, idx) => {
              const isEven = idx % 2 === 0;
              const isActive = hoveredIdx === idx;

              return (
                <li
                  key={step.number}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`reveal relative flex flex-col md:flex-row md:items-center md:gap-10 ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  } py-4 md:py-8`}
                  style={{ transitionDelay: `${idx * 0.08}s` }}
                >
                  {/* Step Card */}
                  <div
                    className={`pl-12 md:pl-0 md:w-[calc(50%-2.5rem)] ${
                      isEven ? 'md:text-right' : 'md:text-left'
                    }`}
                  >
                    <div
                      className={`group relative overflow-hidden rounded-2xl border p-6 md:p-7 backdrop-blur-md transition-all duration-500 ease-editorial ${
                        isActive
                          ? 'border-accent/60 bg-white/[0.08] shadow-[0_20px_50px_-15px_rgba(20,36,51,0.7)] -translate-y-1'
                          : 'border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      {/* Viewfinder Reticle Framing Brackets (4 Corners) */}
                      <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-2.5 transition-opacity duration-400 ease-editorial motion-reduce:hidden ${
                          isActive ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <span className="absolute left-0 top-0 h-2 w-2 border-l border-t border-accent" />
                        <span className="absolute right-0 top-0 h-2 w-2 border-r border-t border-accent" />
                        <span className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-accent" />
                        <span className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-accent" />
                      </div>

                      {/* Phase Header */}
                      <div
                        className={`flex items-center gap-2 mb-2.5 ${
                          isEven ? 'md:justify-end' : 'md:justify-start'
                        }`}
                      >
                        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent-soft font-medium">
                          STEP {step.number} · {step.phase}
                        </span>
                      </div>

                      {/* Step Title */}
                      <h3
                        className={`font-display text-xl sm:text-2xl font-light mb-2.5 transition-colors duration-300 ${
                          isActive ? 'text-accent-tint' : 'text-white'
                        }`}
                      >
                        {step.title}
                      </h3>

                      {/* Step Description */}
                      <p className="font-body text-sm leading-relaxed text-white/70">
                        {step.description}
                      </p>

                      {/* Technical Meta HUD Strip */}
                      <div
                        className={`mt-4 pt-3 border-t border-white/10 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-white/45 ${
                          isEven ? 'md:justify-end' : 'md:justify-start'
                        }`}
                      >
                        <span className="h-1 w-1 rounded-full bg-accent/60" />
                        <span>{step.techMeta}</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Center Lens Node */}
                  <div
                    aria-hidden="true"
                    className={`hidden md:flex absolute left-1/2 -translate-x-1/2 h-13 w-13 rounded-full items-center justify-center z-10 transition-all duration-500 ease-editorial ${
                      isActive
                        ? 'border-2 border-accent bg-ink-soft text-white shadow-[0_0_28px_rgba(118,159,205,0.55)] scale-115'
                        : 'border-2 border-white/20 bg-ink text-accent-soft shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:border-white/40'
                    }`}
                  >
                    {/* Aperture ring indicator */}
                    <div
                      className={`absolute inset-0 rounded-full border border-accent/30 transition-transform duration-700 ease-editorial ${
                        isActive ? 'scale-125 opacity-100' : 'scale-100 opacity-0'
                      }`}
                    />
                    {step.icon(isActive)}
                  </div>

                  {/* Mobile Left Lens Node */}
                  <div
                    aria-hidden="true"
                    className={`md:hidden absolute left-5 -translate-x-1/2 top-8 h-10 w-10 rounded-full flex items-center justify-center z-10 border transition-all duration-300 ${
                      isActive
                        ? 'border-accent bg-ink-soft text-white shadow-[0_0_16px_rgba(118,159,205,0.4)]'
                        : 'border-white/20 bg-ink text-accent-soft'
                    }`}
                  >
                    {step.icon(isActive)}
                  </div>

                  {/* Desktop Layout Counter-weight Spacer */}
                  <div className="hidden md:block md:w-[calc(50%-2.5rem)]" />
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
