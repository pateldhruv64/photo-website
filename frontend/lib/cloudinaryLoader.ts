import type { ImageLoaderProps } from 'next/image';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  const q = quality || 'auto:good';

  if (src.startsWith('http://') || src.startsWith('https://')) {
    // Agar Cloudinary ka full URL hai, to usme requested width inject karo
    if (src.includes('res.cloudinary.com') && src.includes('/image/upload/')) {
      return src.replace(/\/image\/upload\/(?:[a-zA-Z0-9_:,]+\/)?/, `/image/upload/w_${width},q_${q},f_auto,c_limit/`);
    }
    return src;
  }

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},q_${q},f_auto,c_limit/${src}`;
}
