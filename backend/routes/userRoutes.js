const express = require('express');
const router = express.Router();
const {
  getUserById,
  updateProfile,
  deleteAccount,
  trackProfileView,
  getProfileViews,
  searchUsers,
  filterUsers,
  getUserConnections,
  updatePrivacy,
  getPrivacy
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { searchLimiter } = require('../middleware/rateLimiter');

// IMPORTANT: Specific routes MUST come before dynamic :id routes

// Search & Discovery (specific routes first)
router.get('/search', protect, searchLimiter, searchUsers);
router.get('/filter', protect, filterUsers);

// Privacy (specific routes)
router.get('/privacy', protect, getPrivacy);
router.put('/privacy', protect, updatePrivacy);

// Profile Tracking (specific routes)
router.get('/me/profile-views', protect, getProfileViews);

// Profile Operations (specific routes)
router.put('/update', protect, upload.single('profilePicture'), handleUploadError, updateProfile);
router.delete('/me', protect, deleteAccount);

// Dynamic routes with :id (must come AFTER all specific routes)
router.get('/:id', protect, getUserById);
router.post('/:id/view', protect, trackProfileView);
router.get('/:id/connections', protect, getUserConnections);

module.exports = router;