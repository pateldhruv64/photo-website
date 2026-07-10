'use client';

export function GallerySkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-8">
      {/* Category tabs skeleton */}
      <div className="flex gap-3 mb-10 overflow-hidden">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-8 w-20 rounded-full shimmer" />
        ))}
      </div>
      {/* Masonry grid skeleton */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {[180, 240, 160, 300, 200, 270, 150, 220, 190, 260, 140, 310].map((h, i) => (
          <div
            key={i}
            className="shimmer rounded-sm mb-4 break-inside-avoid"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="h-[65vh] md:h-screen w-full shimmer" />
  );
}

export function NavbarSkeleton() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-14 md:h-16 bg-white/80 backdrop-blur-sm border-b border-gray-100" />
  );
}
