import type { ImageLoaderProps } from 'next/image';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  const q = quality || 'auto:good';
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},q_${q},f_auto,c_limit/${src}`;
}
