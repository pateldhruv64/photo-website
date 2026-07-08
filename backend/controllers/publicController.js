const Photo = require('../models/Photo');
const Category = require('../models/Category');
const SiteConfig = require('../models/SiteConfig');

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
