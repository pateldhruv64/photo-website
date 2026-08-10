const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// GET /api/homepage — combined endpoint for homepage data
router.get('/homepage', publicController.getHomepage);

// GET /api/config — site configuration
router.get('/config', publicController.getConfig);

// GET /api/categories — all active categories
router.get('/categories', publicController.getCategories);

// GET /api/seo — resolved SEO payload (meta + local business + ratings)
router.get('/seo', publicController.getSeo);

// GET /api/sitemap — categories + image entries for the XML sitemap
router.get('/sitemap', publicController.getSitemapData);

// GET /api/category/:slug — SSR payload for a single category page
router.get('/category/:slug', publicController.getCategoryPage);

// GET /api/photos/featured — featured photos (must be before /api/photos/:id)
router.get('/photos/featured', publicController.getFeaturedPhotos);

// GET /api/photos?category=slug&page=1&limit=20 — paginated photos
router.get('/photos', publicController.getPhotos);

// GET /api/testimonials — active testimonials
router.get('/testimonials', publicController.getPublicTestimonials);

// GET /api/videos?category=slug — active videos
router.get('/videos', publicController.getPublicVideos);

// Client Gallery (password-protected)
router.post('/client-gallery/unlock', publicController.unlockClientGallery);
router.get('/client-gallery/:slug/photo/:publicId/download', publicController.downloadSinglePhoto);
router.get('/client-gallery/:slug/download-all', publicController.downloadAllPhotosZip);
router.get('/client-gallery/:slug/download-folder', publicController.downloadFolderZip);
router.get('/client-gallery/:slug', publicController.getClientGallery);

module.exports = router;
