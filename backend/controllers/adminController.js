const jwt = require('jsonwebtoken');
const { z } = require('zod');
const Admin = require('../models/Admin');
const Photo = require('../models/Photo');
const Category = require('../models/Category');
const SiteConfig = require('../models/SiteConfig');
const Testimonial = require('../models/Testimonial');
const VideoItem = require('../models/VideoItem');
const ClientGallery = require('../models/ClientGallery');
const { getSignedUploadParams, destroyImage } = require('../utils/cloudinary');
const slugify = require('slugify');

// ─── Revalidation Helper (fire-and-forget) ──────────────────────────
/**
 * Triggers on-demand revalidation on the Next.js frontend.
 * Called after every successful create/update/delete of photos, categories, or config.
 * NEVER awaited — uses .catch() so admin actions don't fail if frontend is down.
 */
const triggerRevalidation = () => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    console.warn('REVALIDATE_SECRET not set, skipping revalidation.');
    return;
  }

  fetch(`${frontendUrl}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret })
  }).catch(err => console.error('Revalidation failed:', err.message));
};

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
  studio_logo: z.object({
    public_id: z.string(),
    secure_url: z.string()
  }).nullable().optional(),
  studio_name: z.string().optional(),
  studio_phone: z.string().optional(),
  studio_website: z.string().optional(),
  studio_services: z.array(z.string()).optional(),
  studio_description: z.string().optional(),
  studio_whatsapp: z.string().optional(),
  studio_location_url: z.string().optional(),
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
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000
});

    res.json({ message: 'Login successful', token, admin: admin.toJSON() });
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
  secure: true,
  sameSite: 'none'
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

    triggerRevalidation();
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
        .sort({ is_featured: -1, created_at: -1 })
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

    triggerRevalidation();
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

    triggerRevalidation();
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

    triggerRevalidation();
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

    triggerRevalidation();
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
    triggerRevalidation();
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
    triggerRevalidation();
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

// ─── Testimonials ────────────────────────────────────────────────────

/**
 * GET /api/admin/testimonials
 */
exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find()
      .sort({ created_at: -1 })
      .lean();
    res.json(testimonials);
  } catch (error) {
    console.error('getTestimonials error:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials.' });
  }
};

/**
 * POST /api/admin/testimonials
 */
exports.createTestimonial = async (req, res) => {
  try {
    const { client_name, event_type, review_text, rating, photo_url, is_active } = req.body;

    if (!client_name || !event_type || !review_text) {
      return res.status(400).json({ error: 'client_name, event_type, and review_text are required.' });
    }

    const testimonial = await Testimonial.create({
      client_name,
      event_type,
      review_text,
      rating: rating || 5,
      photo_url: photo_url || '',
      is_active: is_active !== undefined ? is_active : true
    });

    triggerRevalidation();
    res.status(201).json(testimonial);
  } catch (error) {
    console.error('createTestimonial error:', error);
    res.status(500).json({ error: 'Failed to create testimonial.' });
  }
};

/**
 * PUT /api/admin/testimonials/:id
 */
exports.updateTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found.' });
    }

    triggerRevalidation();
    res.json(testimonial);
  } catch (error) {
    console.error('updateTestimonial error:', error);
    res.status(500).json({ error: 'Failed to update testimonial.' });
  }
};

/**
 * DELETE /api/admin/testimonials/:id
 */
exports.deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found.' });
    }

    triggerRevalidation();
    res.json({ message: 'Testimonial deleted successfully.' });
  } catch (error) {
    console.error('deleteTestimonial error:', error);
    res.status(500).json({ error: 'Failed to delete testimonial.' });
  }
};

// ─── Videos ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/videos
 */
exports.getVideos = async (req, res) => {
  try {
    const videos = await VideoItem.find()
      .sort({ order: 1, created_at: -1 })
      .populate('category', 'name slug')
      .lean();
    res.json(videos);
  } catch (error) {
    console.error('getVideos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos.' });
  }
};

/**
 * POST /api/admin/videos
 */
exports.createVideo = async (req, res) => {
  try {
    const { youtube_url, title, category, order, is_active } = req.body;

    if (!youtube_url || !category) {
      return res.status(400).json({ error: 'youtube_url and category are required.' });
    }

    const video = new VideoItem({
      youtube_url,
      title: title || '',
      category,
      order: order || 0,
      is_active: is_active !== undefined ? is_active : true
    });

    await video.save();
    const populated = await VideoItem.findById(video._id).populate('category', 'name slug');

    triggerRevalidation();
    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This YouTube video has already been added.' });
    }
    console.error('createVideo error:', error);
    res.status(500).json({ error: error.message || 'Failed to create video.' });
  }
};

/**
 * PUT /api/admin/videos/:id
 */
exports.updateVideo = async (req, res) => {
  try {
    const video = await VideoItem.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found.' });
    }

    const { youtube_url, title, category, order, is_active } = req.body;

    if (youtube_url !== undefined) video.youtube_url = youtube_url;
    if (title !== undefined) video.title = title;
    if (category !== undefined) video.category = category;
    if (order !== undefined) video.order = order;
    if (is_active !== undefined) video.is_active = is_active;

    await video.save();
    const populated = await VideoItem.findById(video._id).populate('category', 'name slug');

    triggerRevalidation();
    res.json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This YouTube video already exists.' });
    }
    console.error('updateVideo error:', error);
    res.status(500).json({ error: error.message || 'Failed to update video.' });
  }
};

/**
 * DELETE /api/admin/videos/:id
 */
exports.deleteVideo = async (req, res) => {
  try {
    const video = await VideoItem.findByIdAndDelete(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found.' });
    }

    triggerRevalidation();
    res.json({ message: 'Video deleted successfully.' });
  } catch (error) {
    console.error('deleteVideo error:', error);
    res.status(500).json({ error: 'Failed to delete video.' });
  }
};

// ─── Client Galleries ────────────────────────────────────────────────

/**
 * GET /api/admin/client-galleries
 */
exports.getClientGalleries = async (req, res) => {
  try {
    const galleries = await ClientGallery.find()
      .select('-password_hash')
      .sort({ created_at: -1 })
      .lean();

    // Add photo count
    const result = galleries.map(g => ({
      ...g,
      photoCount: g.photos?.length || 0
    }));

    res.json(result);
  } catch (error) {
    console.error('getClientGalleries error:', error);
    res.status(500).json({ error: 'Failed to fetch client galleries.' });
  }
};

/**
 * POST /api/admin/client-galleries
 */
exports.createClientGallery = async (req, res) => {
  try {
    const { title, slug, password, client_name, event_date, expires_at, is_active } = req.body;

    if (!title || !slug || !password) {
      return res.status(400).json({ error: 'title, slug, and password are required.' });
    }

    const gallery = new ClientGallery({
      title,
      slug: slugify(slug, { lower: true, strict: true }),
      password_hash: password,
      client_name: client_name || '',
      event_date: event_date || null,
      expires_at: expires_at || null,
      is_active: is_active !== undefined ? is_active : true,
      photos: []
    });

    await gallery.save();

    const result = gallery.toObject();
    delete result.password_hash;

    res.status(201).json(result);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Gallery with this slug already exists.' });
    }
    console.error('createClientGallery error:', error);
    res.status(500).json({ error: 'Failed to create client gallery.' });
  }
};

/**
 * PUT /api/admin/client-galleries/:id
 */
exports.updateClientGallery = async (req, res) => {
  try {
    const gallery = await ClientGallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found.' });
    }

    const { title, slug, password, client_name, event_date, expires_at, is_active, photos } = req.body;

    if (title !== undefined) gallery.title = title;
    if (slug !== undefined) gallery.slug = slugify(slug, { lower: true, strict: true });
    if (password) gallery.password_hash = password;
    if (client_name !== undefined) gallery.client_name = client_name;
    if (event_date !== undefined) gallery.event_date = event_date;
    if (expires_at !== undefined) gallery.expires_at = expires_at;
    if (is_active !== undefined) gallery.is_active = is_active;
    if (photos !== undefined) gallery.photos = photos;

    await gallery.save();

    const result = gallery.toObject();
    delete result.password_hash;

    res.json(result);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Gallery with this slug already exists.' });
    }
    console.error('updateClientGallery error:', error);
    res.status(500).json({ error: 'Failed to update client gallery.' });
  }
};

/**
 * DELETE /api/admin/client-galleries/:id
 */
exports.deleteClientGallery = async (req, res) => {
  try {
    const gallery = await ClientGallery.findByIdAndDelete(req.params.id);
    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found.' });
    }
    res.json({ message: 'Client gallery deleted successfully.' });
  } catch (error) {
    console.error('deleteClientGallery error:', error);
    res.status(500).json({ error: 'Failed to delete client gallery.' });
  }
};

/**
 * POST /api/admin/client-galleries/:id/photos
 * Add photos to a client gallery
 */
exports.addClientGalleryPhotos = async (req, res) => {
  try {
    const gallery = await ClientGallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found.' });
    }

    const { photos } = req.body;
    if (!photos || !Array.isArray(photos)) {
      return res.status(400).json({ error: 'photos array is required.' });
    }

    gallery.photos.push(...photos);
    await gallery.save();

    const result = gallery.toObject();
    delete result.password_hash;

    res.json(result);
  } catch (error) {
    console.error('addClientGalleryPhotos error:', error);
    res.status(500).json({ error: 'Failed to add photos.' });
  }
};
