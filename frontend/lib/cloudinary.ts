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

/**
 * Open Graph / Twitter card image — 1200x630 exact, warna social platforms
 * apne hisaab se crop kar dete hain aur preview kharaab dikhta hai.
 */
export const ogImageUrl = (publicId: string): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_1200,h_630,c_fill,g_auto,q_auto:good,f_jpg/${publicId}`;
};

/** Sitemap / schema.org me daalne ke liye stable, full-size public URL. */
export const seoImageUrl = (publicId: string, width = 1600): string => {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},q_auto:good,f_auto/${publicId}`;
};
