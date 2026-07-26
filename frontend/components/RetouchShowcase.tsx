'use client';

import Compare from '@/components/ui/Compare';
import BorderBeam from '@/components/ui/BorderBeam';

export default function RetouchShowcase() {
  // High quality sample images showcasing RAW vs Retouched photography
  const rawImage = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=40&sat=-50";
  const retouchedImage = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=90";

  return (
    <section className="py-16 md:py-24 bg-[#1E1410] text-white relative overflow-hidden">
      {/* Inspira Border Beam on top edge */}
      <BorderBeam size={220} duration={8} colorFrom="#B5784A" colorTo="#FFFFFF" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12 flex flex-col items-center">
          <p className="eyebrow text-amber-300 justify-center mb-2">
            Masterful Post-Processing
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-white">
            The Magic of Retouching & Color Grading
          </h2>
          <p className="mt-3 font-body text-sm md:text-base text-white/70 max-w-lg">
            Drag the slider below to see how we transform raw unedited camera captures into timeless editorial artwork.
          </p>
          <div className="divider-line mx-auto mt-6 max-w-[80px] bg-amber-400/50" />
        </div>

        {/* Compare Component Container */}
        <div className="max-w-4xl mx-auto">
          <Compare
            firstImage={rawImage}
            secondImage={retouchedImage}
            firstImageAlt="RAW unedited wedding portrait"
            secondImageAlt="Final color-graded wedding portrait"
            firstLabel="RAW Capture (Flat Color)"
            secondLabel="Final Retouched Artwork ✨"
            className="h-[340px] sm:h-[480px] md:h-[540px] w-full"
          />
        </div>
      </div>
    </section>
  );
}
