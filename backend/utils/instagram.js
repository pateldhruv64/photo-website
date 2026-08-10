/**
 * ─────────────────────────────────────────────────────────────────────
 *  INSTAGRAM REEL THUMBNAILS
 * ─────────────────────────────────────────────────────────────────────
 *  Problem jo yeh file solve karti hai:
 *
 *  Instagram apne CDN (scontent.cdninstagram.com) ke URLs SIGNED deta
 *  hai — unme `oe=` / `oh=` expiry tokens hote hain. Wo URL DB me save
 *  karo to thumbnail aaj dikhta hai aur kuch ghanton baad grey box ban
 *  jaata hai. Site par bilkul yahi ho raha tha.
 *
 *  Fix: URL nikalte hi usko Cloudinary par copy kar do. Uske baad
 *  thumbnail hamesha ke liye humara hai — expire nahi hoga, aur baaki
 *  photos ke saath usi CDN se serve hoga.
 */

/** fetch ko timeout ke saath chalao — Microlink kabhi kabhi latak jaata hai. */
async function fetchWithTimeout(url, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Instagram post/reel ka preview image URL nikalo (temporary URL).
 * Ise seedha save mat karo — hamesha mirrorInstagramThumbnail() use karo.
 */
async function getInstagramThumbnail(shortcode) {
  if (!shortcode) return '';

  // Reel aur post dono endpoints try karo — shortcode dono ho sakta hai
  const candidates = [
    `https://www.instagram.com/reel/${shortcode}`,
    `https://www.instagram.com/p/${shortcode}`
  ];

  for (const target of candidates) {
    try {
      const res = await fetchWithTimeout(
        `https://api.microlink.io?url=${encodeURIComponent(target)}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status === 'success' && data.data?.image?.url) {
        return data.data.image.url;
      }
    } catch (err) {
      console.error(`[Instagram] ${target} failed:`, err.message);
    }
  }

  return '';
}

/**
 * Thumbnail nikaalo AUR usko Cloudinary par permanently rakh do.
 *
 * @returns {Promise<{url: string, public_id: string} | null>}
 */
async function mirrorInstagramThumbnail(shortcode) {
  const { uploadRemoteImage } = require('./cloudinary');

  const temporaryUrl = await getInstagramThumbnail(shortcode);
  if (!temporaryUrl) return null;

  const mirrored = await uploadRemoteImage(temporaryUrl, 'portfolio/reels');
  if (!mirrored) {
    // Mirror fail hua — temporary URL hi de do. Kuch dinon me expire hoga
    // par abhi to dikhega, aur backfill script baad me theek kar degi.
    console.warn(`[Instagram] ${shortcode}: mirror fail, using temporary URL`);
    return { url: temporaryUrl, public_id: '' };
  }

  return { url: mirrored.secure_url, public_id: mirrored.public_id };
}

function extractInstagramShortcode(url) {
  if (!url) return null;
  const match = url.match(/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

module.exports = {
  getInstagramThumbnail,
  mirrorInstagramThumbnail,
  extractInstagramShortcode,
};
