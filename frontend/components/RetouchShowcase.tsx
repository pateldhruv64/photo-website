'use client';

import Compare from '@/components/ui/Compare';
import BorderBeam from '@/components/ui/BorderBeam';

export default function RetouchShowcase() {
  // High quality sample images showcasing RAW vs Retouched photography
  const rawImage =
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=40&sat=-50';
  const retouchedImage =
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=90';

  return (
    <section className="relative overflow-hidden bg-ink py-20 text-white md:py-28">
      {/* Studio Keylight Radial Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[420px] w-[680px] rounded-full bg-accent/10 blur-[120px]"
      />

      {/* Subtle Border Beam on top edge */}
      <BorderBeam size={240} duration={9} colorFrom="#769FCD" colorTo="#FFFFFF" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <p className="eyebrow mb-2 justify-center text-accent-soft">
            Masterful Post-Processing
          </p>
          <h2 className="font-display text-3xl font-light tracking-tight text-white sm:text-4xl md:text-5xl">
            The Magic of Retouching & Color Grading
          </h2>
          <p className="mt-3.5 max-w-lg font-body text-sm text-white/70 sm:text-base">
            Drag the slider or inspect with the 2.4× loupe to see how raw unedited camera captures
            transform into timeless editorial artwork.
          </p>
          <div className="divider-line mx-auto mt-6 max-w-[80px] bg-accent-soft/40" />
        </div>

        {/* Compare Component Container */}
        <div className="mx-auto max-w-4xl">
          <Compare
            firstImage={rawImage}
            secondImage={retouchedImage}
            firstImageAlt="RAW unedited wedding portrait capture"
            secondImageAlt="Final color-graded master wedding portrait"
            firstLabel="RAW · Flat Neutral Profile"
            secondLabel="16-Bit · Color Graded Master"
            className="h-[340px] w-full sm:h-[480px] md:h-[540px]"
          />
        </div>
      </div>
    </section>
  );
}
