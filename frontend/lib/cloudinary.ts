const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export const photoSrc = (publicId: string): string => publicId;

export const thumbnailUrl = (publicId: string, width = 600): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},q_auto:low,f_auto/${publicId}`;
};

export const fullUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto:good,f_auto/${publicId}`;
};

export const lightboxUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto:good,f_auto,w_1200/${publicId}`;
};

// FIXED: f_jpg force karo blur ke liye — f_auto blur pe kaam nahi karta
export const blurUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_20,e_blur:1000,q_1,f_jpg/${publicId}`;
};

export const heroUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_1920,q_auto:good,f_auto/${publicId}`;
};
