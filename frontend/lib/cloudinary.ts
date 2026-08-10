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

/**
 * Blur placeholder — INLINE data URI, koi network request nahi.
 *
 * Pehle yeh Cloudinary se `w_20,e_blur:1000` wala URL return karta tha.
 * Sunne me chhota lagta hai, par har photo ka apna placeholder request
 * hota tha — homepage par 79 EXTRA HTTP requests, sirf un dhundhli
 * images ke liye jo agle 200ms me replace ho jaani thi. Mobile par har
 * request ka apna latency cost hota hai, aur yeh asli photos se
 * connections cheen rahi thi.
 *
 * Ab ek 8-byte inline SVG hai — palette ka warm-blue tone. Perceived
 * effect wahi (photo load hone tak ek soft coloured block), par
 * network cost bilkul zero.
 *
 * `publicId` argument signature compatibility ke liye rakha hai.
 */
// URL-encoded SVG (base64 nahi) — `Buffer` browser me exist nahi karta,
// aur yeh client + server dono me same string deta hai.
const BLUR_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='8' height='8' fill='%23E8F1F8'/%3E%3C/svg%3E";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const blurUrl = (publicId?: string): string => BLUR_PLACEHOLDER;

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
