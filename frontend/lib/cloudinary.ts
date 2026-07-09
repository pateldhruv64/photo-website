const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/**
 * Generate thumbnail URL for grid display (small, fast loading)
 */
export const thumbnailUrl = (publicId: string, width = 600): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},q_auto:low,f_auto/${publicId}`;
};

/**
 * Generate full-resolution URL for lightbox display
 */
export const fullUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto/${publicId}`;
};

/**
 * Generate optimized lightbox URL (capped at 1200px wide, auto quality/format)
 */
export const lightboxUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto,w_1200/${publicId}`;
};

/**
 * Generate blur placeholder URL (tiny, heavily blurred)
 */
export const blurUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_10,e_blur:1000,q_1,f_auto/${publicId}`;
};

/**
 * Generate responsive URL for hero images
 */
export const heroUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_1920,q_auto,f_auto/${publicId}`;
};
