'use client';

import Masonry from 'react-masonry-css';
import PhotoCard from './PhotoCard';
import type { Photo } from '@/lib/types';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}

/* Mobile par 2 columns — pehle 3 the, jisse har photo itni chhoti ho jaati
   thi ki kuch dikhta hi nahi tha. Photographer ki site par photo dikhni
   chahiye, thumbnail nahi. */
const breakpointColumns = {
  default: 4,
  1280: 4,
  1024: 3,
  640: 2,
};

/**
 * Masonry photo grid.
 *
 * NOTE — yaha se ek poora "preloader" hataya gaya hai. Wo kya karta tha:
 *   - page load ke 1.5s baad 40 photos ke FULL-SIZE (w_1200) versions
 *     download karta tha
 *   - phir har 5 second me 10 aur, jab tak saari photos khatam na ho
 *
 * Matlab ek mobile user jo sirf scroll kar raha hai, uska 20–40MB data
 * chup-chaap khatam ho jaata tha — aur wo downloads unhi photos se
 * bandwidth cheenti thi jo screen par actually dikh rahi thi. Isi se
 * "sab kuch dheere load hota hai" wala feel aata tha.
 *
 * Ab full-size image tabhi load hoti hai jab user lightbox kholta hai,
 * aur Lightbox sirf aage/peeche wali photo prefetch karta hai.
 */
export default function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  if (!photos || photos.length === 0) return null;

  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="masonry-grid"
      columnClassName="masonry-grid-column"
    >
      {photos.map((photo, i) => (
        <PhotoCard key={photo._id} photo={photo} index={i} onClick={onPhotoClick} />
      ))}
    </Masonry>
  );
}
