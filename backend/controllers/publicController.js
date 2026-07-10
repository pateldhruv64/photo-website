const Photo = require('../models/Photo');
const Category = require('../models/Category');
const SiteConfig = require('../models/SiteConfig');
const Testimonial = require('../models/Testimonial');
const VideoItem = require('../models/VideoItem');
const ClientGallery = require('../models/ClientGallery');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const archiver = require('archiver');

/**
 * Verify client gallery JWT token (separate secret from admin JWT)
 */
const verifyClientToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token');
  }
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET + '_client');
};

/**
 * GET /api/config
 * Returns site configuration (cached by SWR on frontend for 1hr)
 */
exports.getConfig = async (req, res) => {
  try {
    const config = await SiteConfig.getConfig();
    res.json(config);
  } catch (error) {
    console.error('getConfig error:', error);
    res.status(500).json({ error: 'Failed to fetch site configuration.' });
  }
};

/**
 * GET /api/categories
 * Returns all active categories sorted by navbar_order
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ is_active: true })
      .populate('cover_photo')
      .sort({ navbar_order: 1 })
      .lean();
    
    res.json(categories);
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

/**
 * GET /api/photos?category=slug&page=1&limit=20
 * Returns paginated photos for a category
 */
exports.getPhotos = async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let filter = {};

    if (category) {
      const cat = await Category.findOne({ slug: category, is_active: true }).lean();
      if (!cat) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      filter.category = cat._id;
    }

    const [photos, total] = await Promise.all([
      Photo.find(filter)
        .sort({ order: 1, created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('category', 'name slug')
        .lean(),
      Photo.countDocuments(filter)
    ]);

    res.json({
      photos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: skip + photos.length < total
      }
    });
  } catch (error) {
    console.error('getPhotos error:', error);
    res.status(500).json({ error: 'Failed to fetch photos.' });
  }
};

/**
 * GET /api/photos/featured
 * Returns featured photos for homepage
 */
exports.getFeaturedPhotos = async (req, res) => {
  try {
    const photos = await Photo.find({ is_featured: true })
      .sort({ order: 1, created_at: -1 })
      .populate('category', 'name slug')
      .lean();

    res.json(photos);
  } catch (error) {
    console.error('getFeaturedPhotos error:', error);
    res.status(500).json({ error: 'Failed to fetch featured photos.' });
  }
};

/**
 * GET /api/homepage
 * Combined endpoint: returns config, categories, featuredPhotos, photos (page 1) in one response.
 * Uses Promise.all for parallel fetching.
 */
exports.getHomepage = async (req, res) => {
  try {
    const [config, categories, featuredPhotos, photos, videos] = await Promise.all([
      SiteConfig.getConfig(),
      Category.find({ is_active: true })
        .populate('cover_photo')
        .sort({ navbar_order: 1 })
        .lean(),
      Photo.find({ is_featured: true })
        .sort({ order: 1, created_at: -1 })
        .populate('category', 'name slug')
        .lean(),
      Photo.find({})
        .sort({ order: 1, created_at: -1 })
        .populate('category', 'name slug')
        .lean(),
      VideoItem.find({ is_active: true })
        .sort({ order: 1, created_at: -1 })
        .populate('category', 'name slug')
        .lean()
    ]);

    res.json({
      config,
      categories,
      featuredPhotos,
      photos,
      videos
    });
  } catch (error) {
    console.error('getHomepage error:', error);
    res.status(500).json({ error: 'Failed to fetch homepage data.' });
  }
};

/**
 * GET /api/testimonials
 * Returns all active testimonials
 */
exports.getPublicTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ is_active: true })
      .sort({ created_at: -1 })
      .lean();

    res.json(testimonials);
  } catch (error) {
    console.error('getPublicTestimonials error:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials.' });
  }
};

/**
 * GET /api/videos?category=slug
 * Returns active videos, optionally filtered by category slug
 */
exports.getPublicVideos = async (req, res) => {
  try {
    const { category } = req.query;
    let filter = { is_active: true };

    if (category) {
      const cat = await Category.findOne({ slug: category, is_active: true }).lean();
      if (!cat) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      filter.category = cat._id;
    }

    const videos = await VideoItem.find(filter)
      .sort({ order: 1, created_at: -1 })
      .populate('category', 'name slug')
      .lean();

    res.json(videos);
  } catch (error) {
    console.error('getPublicVideos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos.' });
  }
};

/**
 * POST /api/client-gallery/unlock
 * Verify password and return a short-lived JWT (24h)
 * Body: { slug, password }
 */
exports.unlockClientGallery = async (req, res) => {
  try {
    const { slug, password } = req.body;

    if (!slug || !password) {
      return res.status(400).json({ error: 'slug and password are required.' });
    }

    const gallery = await ClientGallery.findOne({ slug, is_active: true });
    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found.' });
    }

    // Check expiry
    if (gallery.expires_at && new Date() > gallery.expires_at) {
      return res.status(410).json({ error: 'This gallery link has expired.' });
    }

    // Verify password
    const isValid = await gallery.verifyPassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Generate a gallery-specific JWT (24h) with separate secret
    const token = jwt.sign(
      { galleryId: gallery._id, slug: gallery.slug },
      process.env.JWT_SECRET + '_client',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      title: gallery.title,
      client_name: gallery.client_name
    });
  } catch (error) {
    console.error('unlockClientGallery error:', error);
    res.status(500).json({ error: 'Failed to unlock gallery.' });
  }
};

/**
 * GET /api/client-gallery/:slug
 * Returns gallery photos. Requires Bearer token from unlock.
 */
exports.getClientGallery = async (req, res) => {
  try {
    const { slug } = req.params;

    let decoded;
    try {
      decoded = verifyClientToken(req);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired access token.' });
    }

    // Ensure token matches requested gallery
    if (decoded.slug !== slug) {
      return res.status(403).json({ error: 'Token does not match this gallery.' });
    }

    const gallery = await ClientGallery.findOne({ slug, is_active: true })
      .select('-password_hash')
      .lean();

    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found.' });
    }

    // Check expiry
    if (gallery.expires_at && new Date() > gallery.expires_at) {
      return res.status(410).json({ error: 'This gallery link has expired.' });
    }

    res.json(gallery);
  } catch (error) {
    console.error('getClientGallery error:', error);
    res.status(500).json({ error: 'Failed to fetch gallery.' });
  }
};

/**
 * GET /api/client-gallery/:slug/photo/:publicId/download
 * Proxy-stream original quality photo from Cloudinary (zero transforms)
 */
exports.downloadSinglePhoto = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = verifyClientToken(req);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired access token.' });
    }

    const { slug, publicId } = req.params;

    if (decoded.slug !== slug) {
      return res.status(403).json({ error: 'Token does not match this gallery.' });
    }

    const gallery = await ClientGallery.findOne({ slug, is_active: true }).lean();
    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found.' });
    }

    // Check expiry
    if (gallery.expires_at && new Date() > gallery.expires_at) {
      return res.status(410).json({ error: 'This gallery link has expired.' });
    }

    // Security: verify publicId belongs to this gallery
    const photo = gallery.photos.find(p => p.public_id === publicId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found in this gallery.' });
    }

    // Original URL — ZERO transformations
    const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;

    const response = await axios.get(cloudinaryUrl, {
      responseType: 'stream',
      headers: { 'Accept': '*/*' }
    });

    const galleryName = gallery.title.replace(/[^a-zA-Z0-9]/g, '_');
    const format = photo.original_format || 'jpg';
    const filename = `${galleryName}_${photo.title || publicId.split('/').pop()}.${format}`;

    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    response.data.pipe(res);
  } catch (error) {
    console.error('downloadSinglePhoto error:', error.message);
    res.status(500).json({ error: 'Failed to download photo.' });
  }
};

/**
 * GET /api/client-gallery/:slug/download-all
 * Stream a flat zip of all original photos (no folder structure)
 */
exports.downloadAllPhotosZip = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = verifyClientToken(req);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired access token.' });
    }

    const { slug } = req.params;

    if (decoded.slug !== slug) {
      return res.status(403).json({ error: 'Token does not match this gallery.' });
    }

    const gallery = await ClientGallery.findOne({ slug, is_active: true }).lean();
    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found.' });
    }

    if (gallery.expires_at && new Date() > gallery.expires_at) {
      return res.status(410).json({ error: 'This gallery link has expired.' });
    }

    const galleryName = gallery.title.replace(/[^a-zA-Z0-9]/g, '_');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${galleryName}.zip"`);

    const archive = archiver('zip', { zlib: { level: 0 } });
    archive.pipe(res);

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      res.status(500).end();
    });

    // SEQUENTIALLY fetch each photo to avoid Cloudinary rate limits
    for (const photo of gallery.photos) {
      const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${photo.public_id}`;
      try {
        const photoResponse = await axios.get(cloudinaryUrl, { responseType: 'stream' });
        const format = photo.original_format || 'jpg';
        const filename = `${photo.title || photo.public_id.split('/').pop()}.${format}`;
        archive.append(photoResponse.data, { name: filename });
      } catch (err) {
        console.error(`Failed to fetch photo ${photo.public_id}:`, err.message);
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('downloadAllPhotosZip error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create zip.' });
    }
  }
};

/**
 * GET /api/client-gallery/:slug/download-folder
 * Stream a zip with gallery-named folder inside (same as download-all but with subfolder)
 */
exports.downloadFolderZip = async (req, res) => {
  try {
    let decoded;
    try {
      decoded = verifyClientToken(req);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired access token.' });
    }

    const { slug } = req.params;

    if (decoded.slug !== slug) {
      return res.status(403).json({ error: 'Token does not match this gallery.' });
    }

    const gallery = await ClientGallery.findOne({ slug, is_active: true }).lean();
    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found.' });
    }

    if (gallery.expires_at && new Date() > gallery.expires_at) {
      return res.status(410).json({ error: 'This gallery link has expired.' });
    }

    const galleryName = gallery.title.replace(/[^a-zA-Z0-9]/g, '_');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${galleryName}.zip"`);

    const archive = archiver('zip', { zlib: { level: 0 } });
    archive.pipe(res);

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      res.status(500).end();
    });

    // SEQUENTIALLY fetch — photos go inside gallery-named folder
    for (const photo of gallery.photos) {
      const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${photo.public_id}`;
      try {
        const photoResponse = await axios.get(cloudinaryUrl, { responseType: 'stream' });
        const format = photo.original_format || 'jpg';
        const filename = `${photo.title || photo.public_id.split('/').pop()}.${format}`;
        archive.append(photoResponse.data, { name: `${galleryName}/${filename}` });
      } catch (err) {
        console.error(`Failed to fetch photo ${photo.public_id}:`, err.message);
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('downloadFolderZip error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create zip.' });
    }
  }
};
