/**
 * Helper to fetch Instagram video thumbnail automatically using Microlink API
 */
async function getInstagramThumbnail(shortcode) {
  if (!shortcode) return '';
  
  try {
    // Try reel endpoint first
    const reelRes = await fetch(`https://api.microlink.io?url=https://www.instagram.com/reel/${shortcode}`);
    const reelData = await reelRes.json();
    if (reelData.status === 'success' && reelData.data?.image?.url) {
      return reelData.data.image.url;
    }

    // Fallback to post endpoint
    const postRes = await fetch(`https://api.microlink.io?url=https://www.instagram.com/p/${shortcode}`);
    const postData = await postRes.json();
    if (postData.status === 'success' && postData.data?.image?.url) {
      return postData.data.image.url;
    }
  } catch (err) {
    console.error(`[Instagram] Failed to fetch thumbnail for ${shortcode}:`, err.message);
  }

  return '';
}

function extractInstagramShortcode(url) {
  if (!url) return null;
  const match = url.match(/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

module.exports = {
  getInstagramThumbnail,
  extractInstagramShortcode,
};
