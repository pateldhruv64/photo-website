const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// ─── Auth (no middleware) ────────────────────────────────────────────
router.post('/login', adminController.login);
router.post('/logout', adminController.logout);

// ─── All routes below require authentication ─────────────────────────
router.use(auth);

// Me
router.get('/me', adminController.getMe);

// Stats
router.get('/stats', adminController.getStats);
router.get('/analytics', adminController.getAnalytics);

// Cloudinary signature
router.get('/cloudinary-signature', adminController.getCloudinarySignature);

// Photos
router.get('/photos', adminController.getAllPhotos);
router.post('/photos/upload', adminController.uploadPhoto);
router.put('/photos/:id', adminController.updatePhoto);
router.delete('/photos/:id', adminController.deletePhoto);

// Categories
router.get('/categories', adminController.getAllCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Site Config
router.put('/config', adminController.updateConfig);

// Testimonials
router.get('/testimonials', adminController.getTestimonials);
router.post('/testimonials', adminController.createTestimonial);
router.put('/testimonials/:id', adminController.updateTestimonial);
router.delete('/testimonials/:id', adminController.deleteTestimonial);

// Videos
router.get('/videos', adminController.getVideos);
router.post('/videos', adminController.createVideo);
router.put('/videos/:id', adminController.updateVideo);
router.delete('/videos/:id', adminController.deleteVideo);

// Client Galleries
router.get('/client-galleries', adminController.getClientGalleries);
router.post('/client-galleries', adminController.createClientGallery);
router.put('/client-galleries/:id', adminController.updateClientGallery);
router.delete('/client-galleries/:id', adminController.deleteClientGallery);
router.post('/client-galleries/:id/photos', adminController.addClientGalleryPhotos);

module.exports = router;
