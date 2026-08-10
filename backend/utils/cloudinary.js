const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Generate signed upload params for direct client-to-Cloudinary uploads.
 * Signature expires in 60 seconds.
 */
const getSignedUploadParams = () => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = 'portfolio';
  
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder
    },
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    folder,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY
  };
};

/**
 * Kisi remote image URL ko Cloudinary par permanently mirror karo.
 *
 * Kyun zaroori hai: Instagram ke thumbnail URLs (scontent.cdninstagram.com)
 * signed hote hain aur kuch ghanton me expire ho jaate hain. Unhe seedha
 * DB me save karne se thumbnail aaj dikhta hai aur kal grey box ban jaata
 * hai. Yaha ek baar copy karke apne CDN par rakh lete hain — phir wo
 * kabhi nahi marta, aur baaki site ke saath hi cache hota hai.
 *
 * @returns {Promise<{secure_url: string, public_id: string} | null>}
 */
const uploadRemoteImage = async (url, folder = 'portfolio/thumbnails') => {
  if (!url || !/^https?:\/\//.test(url)) return null;

  try {
    const result = await cloudinary.uploader.upload(url, {
      folder,
      resource_type: 'image',
      // Reels 9:16 hoti hain par card 16:9 dikhata hai — g_auto subject
      // ko frame me rakhta hai. 800px card ke liye kaafi hai.
      transformation: [{ width: 800, crop: 'limit', quality: 'auto:good' }],
      timeout: 20000
    });
    return { secure_url: result.secure_url, public_id: result.public_id };
  } catch (error) {
    console.error('[Cloudinary] Remote mirror failed:', error.message);
    return null;
  }
};

/**
 * Delete an image from Cloudinary by public_id.
 */
const destroyImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary destroy error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  getSignedUploadParams,
  uploadRemoteImage,
  destroyImage
};
