import { GallerySkeleton, NavbarSkeleton } from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <main>
      <NavbarSkeleton />
      <div className="pt-20">
        <GallerySkeleton />
      </div>
    </main>
  );
}
