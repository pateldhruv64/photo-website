const jwt = require('jsonwebtoken');
const { z } = require('zod');
const Admin = require('../models/Admin');
const Photo = require('../models/Photo');
const Category = require('../models/Category');
const SiteConfig = require('../models/SiteConfig');
const { getSignedUploadParams, destroyImage } = require('../utils/cloudinary');
const slugify = require('slugify');

// ─── Validation Schemas ─────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

const photoUploadSchema = z.object({
  public_id: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  title: z.string().optional().default(''),
  category: z.string().min(1, 'Category ID is required'),
  is_featured: z.boolean().optional().default(false),
  order: z.number().optional().default(0)
});

const photoUpdateSchema = z.object({
  title: z.string().optional(),
  category: z.string().optional(),
  is_featured: z.boolean().optional(),
  order: z.number().optional()
});

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().optional(),
  description: z.string().optional().default(''),
  show_in_navbar: z.boolean().optional().default(false),
  navbar_order: z.number().optional().default(0),
  is_active: z.boolean().optional().default(true),
  cover_photo: z.string().nullable().optional()
});

const configUpdateSchema = z.object({
  photographer_name: z.string().optional(),
  hero_title: z.string().optional(),
  hero_subtitle: z.string().optional(),
  hero_photo: z.string().nullable().optional(),
  about_text: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  social_links: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    youtube: z.string().optional()
  }).optional(),
  navbar_links: z.array(z.object({
    label: z.string(),
    url: z.string(),
    order: z.number().optional()
  })).optional()
});

// ─── Auth ────────────────────────────────────────────────────────────

/**
 * POST /api/admin/login
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    
    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ message: 'Login successful', admin: admin.toJSON() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
};

/**
 * POST /api/admin/logout
 */
exports.logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });
  res.json({ message: 'Logged out successfully.' });
};

/**
 * GET /api/admin/me
 */
exports.getMe = async (req, res) => {
  res.json({ admin: req.admin.toJSON() });
};

// ─── Photos ──────────────────────────────────────────────────────────

/**
 * POST /api/admin/photos/upload
 * Save Cloudinary metadata to DB
 */
exports.uploadPhoto = async (req, res) => {
  try {
    const data = photoUploadSchema.parse(req.body);
    
    const photo = await Photo.create({
      public_id: data.public_id,
      width: data.width,
      height: data.height,
      aspect_ratio: data.width / data.height,
      title: data.title,
      category: data.category,
      is_featured: data.is_featured,
      order: data.order
    });

    const populated = await Photo.findById(photo._id)
      .populate('category', 'name slug');

    res.status(201).json(populated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Photo with this public_id already exists.' });
    }
    console.error('uploadPhoto error:', error);
    res.status(500).json({ error: 'Failed to save photo.' });
  }
};

/**
 * GET /api/admin/photos
 * Get all photos (admin view, paginated)
 */
exports.getAllPhotos = async (req, res) => {
  try {
    const { page = 1, limit = 50, category } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let filter = {};
    if (category) {
      filter.category = category;
    }

    const [photos, total] = await Promise.all([
      Photo.find(filter)
        .sort({ created_at: -1 })
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
    console.error('getAllPhotos error:', error);
    res.status(500).json({ error: 'Failed to fetch photos.' });
  }
};

/**
 * PUT /api/admin/photos/:id
 */
exports.updatePhoto = async (req, res) => {
  try {
    const data = photoUpdateSchema.parse(req.body);
    
    const photo = await Photo.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found.' });
    }

    res.json(photo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('updatePhoto error:', error);
    res.status(500).json({ error: 'Failed to update photo.' });
  }
};

/**
 * DELETE /api/admin/photos/:id
 * Deletes from both Cloudinary AND MongoDB
 */
exports.deletePhoto = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found.' });
    }

    // Delete from Cloudinary
    try {
      await destroyImage(photo.public_id);
    } catch (cloudinaryError) {
      console.error('Cloudinary delete warning:', cloudinaryError);
      // Continue with DB delete even if Cloudinary fails
    }

    // Delete from MongoDB
    await Photo.findByIdAndDelete(req.params.id);

    res.json({ message: 'Photo deleted successfully.' });
  } catch (error) {
    console.error('deletePhoto error:', error);
    res.status(500).json({ error: 'Failed to delete photo.' });
  }
};

// ─── Categories ──────────────────────────────────────────────────────

/**
 * POST /api/admin/categories
 */
exports.createCategory = async (req, res) => {
  try {
    const data = categorySchema.parse(req.body);
    
    // If slug provided, use it; otherwise auto-generate
    if (data.slug) {
      data.slug = slugify(data.slug, { lower: true, strict: true });
    }

    const category = new Category(data);
    if (data.slug) {
      category.slug = data.slug;
      category._slugManuallySet = true;
    }
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Category with this slug already exists.' });
    }
    console.error('createCategory error:', error);
    res.status(500).json({ error: 'Failed to create category.' });
  }
};

/**
 * GET /api/admin/categories
 * Get all categories (including inactive ones for admin)
 */
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('cover_photo')
      .sort({ navbar_order: 1 })
      .lean();
    
    // Get photo count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const photoCount = await Photo.countDocuments({ category: cat._id });
        return { ...cat, photoCount };
      })
    );

    res.json(categoriesWithCount);
  } catch (error) {
    console.error('getAllCategories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

/**
 * PUT /api/admin/categories/:id
 */
exports.updateCategory = async (req, res) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Handle slug update
    if (data.slug !== undefined) {
      data.slug = slugify(data.slug, { lower: true, strict: true });
      category._slugManuallySet = true;
    }

    Object.assign(category, data);
    await category.save();

    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Category with this slug already exists.' });
    }
    console.error('updateCategory error:', error);
    res.status(500).json({ error: 'Failed to update category.' });
  }
};

/**
 * DELETE /api/admin/categories/:id
 */
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Check if category has photos
    const photoCount = await Photo.countDocuments({ category: category._id });
    if (photoCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category with ${photoCount} photo(s). Move or delete photos first.`,
        photoCount 
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('deleteCategory error:', error);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
};

// ─── Site Config ─────────────────────────────────────────────────────

/**
 * PUT /api/admin/config
 */
exports.updateConfig = async (req, res) => {
  try {
    const data = configUpdateSchema.parse(req.body);
    
    let config = await SiteConfig.findOne();
    if (!config) {
      config = new SiteConfig(data);
    } else {
      Object.assign(config, data);
    }
    
    await config.save();
    
    // Return populated version
    config = await SiteConfig.findById(config._id).populate('hero_photo');
    res.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('updateConfig error:', error);
    res.status(500).json({ error: 'Failed to update configuration.' });
  }
};

// ─── Cloudinary Signature ────────────────────────────────────────────

/**
 * GET /api/admin/cloudinary-signature
 */
exports.getCloudinarySignature = async (req, res) => {
  try {
    const params = getSignedUploadParams();
    res.json(params);
  } catch (error) {
    console.error('getCloudinarySignature error:', error);
    res.status(500).json({ error: 'Failed to generate upload signature.' });
  }
};

// ─── Dashboard Stats ─────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 */
exports.getStats = async (req, res) => {
  try {
    const [totalPhotos, totalCategories, featuredPhotos] = await Promise.all([
      Photo.countDocuments(),
      Category.countDocuments(),
      Photo.countDocuments({ is_featured: true })
    ]);

    res.json({
      totalPhotos,
      totalCategories,
      featuredPhotos
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};
