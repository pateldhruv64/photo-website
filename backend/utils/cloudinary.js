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
  destroyImage
};
