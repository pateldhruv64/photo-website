import { GallerySkeleton, HeroSkeleton, NavbarSkeleton } from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <main>
      <NavbarSkeleton />
      <HeroSkeleton />
      <div className="relative z-10 bg-white">
        <GallerySkeleton />
      </div>
    </main>
  );
}
