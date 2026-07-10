import type { ImageLoaderProps } from 'next/image';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  const q = quality || 'auto';
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  // src will be just the public_id (e.g. "portfolio/wedding/abc123")
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},q_${q},f_auto,c_limit/${src}`;
}
