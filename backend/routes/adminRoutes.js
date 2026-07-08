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

module.exports = router;
