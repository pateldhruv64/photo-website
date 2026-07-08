const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// GET /api/config — site configuration
router.get('/config', publicController.getConfig);

// GET /api/categories — all active categories
router.get('/categories', publicController.getCategories);

// GET /api/photos/featured — featured photos (must be before /api/photos/:id)
router.get('/photos/featured', publicController.getFeaturedPhotos);

// GET /api/photos?category=slug&page=1&limit=20 — paginated photos
router.get('/photos', publicController.getPhotos);

module.exports = router;
