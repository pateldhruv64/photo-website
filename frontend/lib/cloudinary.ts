const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// Use this as `src` prop in Next.js <Image> — loader handles the full URL
export const photoSrc = (publicId: string): string => publicId;

// These are for non-Image uses (og:image, preloading, direct <img>, etc.)
export const thumbnailUrl = (publicId: string, width = 600): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},q_auto:low,f_auto/${publicId}`;
};

export const fullUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto/${publicId}`;
};

export const lightboxUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto,w_1200/${publicId}`;
};

export const blurUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_10,e_blur:1000,q_1,f_auto/${publicId}`;
};

export const heroUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_1920,q_auto,f_auto/${publicId}`;
};
