const Photo = require('../models/Photo');
const Category = require('../models/Category');
const SiteConfig = require('../models/SiteConfig');
const Testimonial = require('../models/Testimonial');
const VideoItem = require('../models/VideoItem');
const ClientGallery = require('../models/ClientGallery');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { resolveSiteSeo, buildCategorySeo, buildPhotoAlt } = require('../utils/seo');
const {
  buildPhotoFileName,
  originalUrl,
  streamGalleryZip,
} = require('../utils/galleryFiles');

/**
 * Verify client gallery JWT token (separate secret from admin JWT)
 */
const verifyClientToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token');
  }
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET + '_client', { algorithms: ['HS256'] });
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

    if (typeof category === 'string' && category.trim()) {
      const cat = await Category.findOne({ slug: category.trim(), is_active: true }).lean();
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

    const config = await SiteConfig.getConfig();
    const siteSeo = config.seo || {};

    res.json({
      photos: photos.map((p) => ({
        ...p,
        alt_text: buildPhotoAlt(p, p.category?.name, config, siteSeo)
      })),
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
    /* Pehle yaha `Photo.find({})` tha — bina limit ke SAARI photos.
       30 photos par thik chalta tha, par 500 photos par yeh ~300KB JSON
       ban jaata aur har homepage visit par jaata. Ab pehla page hi
       bhejte hain; baaki "load more" par /api/photos se aata hai.

       Featured photos bhi cap kiye hain — marquee me 12 se zyada kabhi
       nahi dikhti. */
    // 24 photos pehle screen ke liye kaafi se zyada hain — iske aage
    // sab kuch scroll par aata hai. Yeh HTML aur RSC payload dono
    // chhota rakhta hai.
    const PAGE_SIZE = 24;
    const FEATURED_LIMIT = 10;

    const [config, categories, featuredPhotos, photos, totalPhotos, videos, testimonials] =
      await Promise.all([
        SiteConfig.getConfig(),
        Category.find({ is_active: true })
          .populate('cover_photo')
          .sort({ navbar_order: 1 })
          .lean(),
        Photo.find({ is_featured: true })
          .sort({ order: 1, created_at: -1 })
          .limit(FEATURED_LIMIT)
          .populate('category', 'name slug')
          .lean(),
        Photo.find({})
          .sort({ order: 1, created_at: -1 })
          .limit(PAGE_SIZE)
          .populate('category', 'name slug')
          .lean(),
        Photo.countDocuments({}),
        VideoItem.find({ is_active: true })
          .sort({ order: 1, created_at: -1 })
          .limit(12)
          .populate('category', 'name slug')
          .lean(),
        // Testimonials bhi yahi bhej do — pehle frontend inke liye ek
        // alag round-trip karta tha.
        Testimonial.find({ is_active: true })
          .sort({ created_at: -1 })
          .limit(12)
          .lean()
      ]);

    // Har category ka photo count — tabs me dikhane ke liye, taki
    // frontend ko saari photos client par ginni na pade.
    const counts = await Photo.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    categories.forEach((cat) => {
      cat.photoCount = countMap.get(String(cat._id)) || 0;
    });

    // Har photo par SEO-friendly alt text chipka do (blank ho to auto-generate)
    const siteSeo = config.seo || {};
    const withAlt = (list) => list.map((p) => ({
      ...p,
      alt_text: buildPhotoAlt(p, p.category?.name, config, siteSeo)
    }));

    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600');
    res.json({
      config,
      categories,
      featuredPhotos: withAlt(featuredPhotos),
      photos: withAlt(photos),
      videos,
      testimonials,
      pagination: {
        page: 1,
        limit: PAGE_SIZE,
        total: totalPhotos,
        hasMore: photos.length < totalPhotos
      }
    });
  } catch (error) {
    console.error('getHomepage error:', error);
    res.status(500).json({ error: 'Failed to fetch homepage data.' });
  }
};

/**
 * GET /api/seo
 * Poora resolved SEO payload — meta tags, keywords, local business data
 * aur aggregate rating. Frontend isi ek call se saara metadata + JSON-LD
 * bana leta hai. Blank admin fields yaha auto-fill hote hain.
 */
exports.getSeo = async (req, res) => {
  try {
    const [config, categories, testimonials, photoCount, videoCount] = await Promise.all([
      SiteConfig.getConfig(),
      Category.find({ is_active: true })
        .populate('cover_photo')
        .sort({ navbar_order: 1 })
        .lean(),
      Testimonial.find({ is_active: true }).select('rating').lean(),
      Photo.countDocuments({}),
      VideoItem.countDocuments({ is_active: true })
    ]);

    // AggregateRating schema ke liye — Google rich snippet me stars dikhte hain
    const rated = testimonials.filter((t) => typeof t.rating === 'number' && t.rating > 0);
    const ratingValue = rated.length
      ? Number((rated.reduce((sum, t) => sum + t.rating, 0) / rated.length).toFixed(1))
      : null;

    const stats = {
      photo_count: photoCount,
      video_count: videoCount,
      category_count: categories.length,
      review_count: rated.length,
      rating_value: ratingValue
    };

    const seo = resolveSiteSeo({ config, categories, stats });

    // Har category ka resolved SEO bhi bhej do — frontend ko dobara compute nahi karna padta
    seo.categories = categories.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      intro_text: cat.intro_text || '',
      cover_public_id: cat.cover_photo?.public_id || '',
      updated_at: cat.updatedAt || cat.createdAt || null,
      ...buildCategorySeo(cat, config, config.seo || {})
    }));

    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    res.json(seo);
  } catch (error) {
    console.error('getSeo error:', error);
    res.status(500).json({ error: 'Failed to build SEO payload.' });
  }
};

/**
 * GET /api/sitemap
 * Sitemap ke liye chhota payload: categories + lastmod + top images.
 * Image sitemap se Google Images me photos index hoti hain.
 */
exports.getSitemapData = async (req, res) => {
  try {
    const [config, categories] = await Promise.all([
      SiteConfig.getConfig(),
      Category.find({ is_active: true })
        .populate('cover_photo')
        .sort({ navbar_order: 1 })
        .lean()
    ]);

    const entries = await Promise.all(
      categories.map(async (cat) => {
        // Har category ki top 40 photos image-sitemap me daalte hain.
        // Isse zyada bhejne se sitemap bloat ho jaata hai.
        const [photos, latest] = await Promise.all([
          Photo.find({ category: cat._id })
            .sort({ order: 1, created_at: -1 })
            .limit(40)
            .select('public_id title alt_text caption location')
            .lean(),
          Photo.findOne({ category: cat._id })
            .sort({ created_at: -1 })
            .select('created_at')
            .lean()
        ]);

        return {
          slug: cat.slug,
          name: cat.name,
          last_modified: latest?.created_at || cat.updatedAt || cat.createdAt || null,
          photo_count: photos.length,
          images: photos.map((p) => ({
            public_id: p.public_id,
            title: p.title || cat.name,
            caption: p.caption || '',
            alt: buildPhotoAlt(p, cat.name, config, config.seo || {})
          }))
        };
      })
    );

    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=3600');
    res.json({
      allow_indexing: config.seo?.allow_indexing !== false,
      categories: entries
    });
  } catch (error) {
    console.error('getSitemapData error:', error);
    res.status(500).json({ error: 'Failed to build sitemap data.' });
  }
};

/**
 * GET /api/category/:slug
 * Ek call me category page ka saara SSR data — category, resolved SEO,
 * pehle page ki photos (alt text ke saath) aur videos.
 * Isse category page server par render ho paata hai, jo Google ke liye zaroori hai.
 */
exports.getCategoryPage = async (req, res) => {
  try {
    const { slug } = req.params;
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit) || 24));

    const category = await Category.findOne({ slug, is_active: true })
      .populate('cover_photo')
      .lean();

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const [config, photos, total, videos] = await Promise.all([
      SiteConfig.getConfig(),
      Photo.find({ category: category._id })
        .sort({ order: 1, created_at: -1 })
        .limit(limit)
        .populate('category', 'name slug')
        .lean(),
      Photo.countDocuments({ category: category._id }),
      VideoItem.find({ category: category._id, is_active: true })
        .sort({ order: 1, created_at: -1 })
        .populate('category', 'name slug')
        .lean()
    ]);

    const siteSeo = config.seo || {};
    const withAlt = photos.map((p) => ({
      ...p,
      alt_text: buildPhotoAlt(p, category.name, config, siteSeo)
    }));

    res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
    res.json({
      category,
      seo: buildCategorySeo(category, config, siteSeo),
      config,
      photos: withAlt,
      videos,
      pagination: {
        page: 1,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: withAlt.length < total
      }
    });
  } catch (error) {
    console.error('getCategoryPage error:', error);
    res.status(500).json({ error: 'Failed to fetch category page.' });
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

    if (typeof category === 'string' && category.trim()) {
      const cat = await Category.findOne({ slug: category.trim(), is_active: true }).lean();
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
 * Token verify + gallery load + expiry check — teeno download endpoints
 * ke liye ek hi jagah. `null` return matlab response already bhej diya.
 */
const loadGalleryForClient = async (req, res) => {
  let decoded;
  try {
    decoded = verifyClientToken(req);
  } catch {
    res.status(401).json({ error: 'Invalid or expired access token.' });
    return null;
  }

  const { slug } = req.params;
  if (decoded.slug !== slug) {
    res.status(403).json({ error: 'Token does not match this gallery.' });
    return null;
  }

  const gallery = await ClientGallery.findOne({ slug, is_active: true }).lean();
  if (!gallery) {
    res.status(404).json({ error: 'Gallery not found.' });
    return null;
  }

  if (gallery.expires_at && new Date() > gallery.expires_at) {
    res.status(410).json({ error: 'This gallery link has expired.' });
    return null;
  }

  return gallery;
};

/**
 * GET /api/client-gallery/:slug/photo/:publicId/download
 *
 * Ek photo ka original file proxy karke deta hai.
 *
 * NOTE: Normal case me frontend yeh endpoint use hi nahi karta — wo
 * Cloudinary ka `fl_attachment` URL seedha browser ko deta hai, jisse
 * file CDN se aati hai (hamare server ka ek bhi byte kharch nahi hota,
 * aur speed 5-10x hoti hai). Yeh route sirf fallback ke liye zinda hai,
 * agar kisi client ke network par CDN block ho.
 */
exports.downloadSinglePhoto = async (req, res) => {
  try {
    const gallery = await loadGalleryForClient(req, res);
    if (!gallery) return;

    const { publicId } = req.params;

    // Security: verify publicId belongs to this gallery
    const ordered = [...(gallery.photos || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    const index = ordered.findIndex((p) => p.public_id === publicId);
    if (index === -1) {
      return res.status(404).json({ error: 'Photo not found in this gallery.' });
    }

    const response = await axios.get(originalUrl(publicId), {
      responseType: 'stream',
      timeout: 60000,
      headers: { Accept: '*/*' },
    });

    const filename = buildPhotoFileName(ordered[index], index, ordered.length);

    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store, no-transform');
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    req.on('close', () => response.data.destroy());
    response.data.pipe(res);
  } catch (error) {
    console.error('downloadSinglePhoto error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download photo.' });
    } else {
      res.destroy();
    }
  }
};

/**
 * GET /api/client-gallery/:slug/download-all       → flat zip
 * GET /api/client-gallery/:slug/download-folder    → zip with a folder inside
 *
 * Dono ek hi streaming engine use karte hain (utils/galleryFiles.js).
 * `?only=id1,id2` bhejo to sirf wahi photos zip hoti hain — "selected
 * photos download" isi se chalta hai.
 */
const zipHandler = (withFolder) => async (req, res) => {
  try {
    const gallery = await loadGalleryForClient(req, res);
    if (!gallery) return;

    const only = typeof req.query.only === 'string' && req.query.only.trim()
      ? req.query.only.split(',').map((s) => s.trim()).filter(Boolean)
      : null;

    await streamGalleryZip({ req, res, gallery, withFolder, only });
  } catch (error) {
    console.error('gallery zip error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create zip.' });
    } else {
      res.destroy();
    }
  }
};

exports.downloadAllPhotosZip = zipHandler(false);
exports.downloadFolderZip = zipHandler(true);
