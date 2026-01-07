const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { upload } = require('../middleware/upload'); // ← Add destructuring here
const achievementController = require('../controllers/achievementController');

// Public routes
router.get('/', achievementController.getAllAchievements);
router.get('/featured', achievementController.getFeaturedAchievements);
router.get('/trending', achievementController.getTrendingAchievements);
router.get('/:id', achievementController.getAchievementById);
router.post('/:id/view', achievementController.viewAchievement);

// Protected routes (any logged-in user)
router.post('/:id/like', protect, achievementController.likeAchievement);

// Admin only routes
router.post(
  '/', 
  protect, 
  isAdmin, 
  upload.array('images', 5), 
  achievementController.createAchievement
);

router.put(
  '/:id', 
  protect, 
  isAdmin, 
  upload.array('images', 5), 
  achievementController.updateAchievement
);

router.delete(
  '/:id', 
  protect, 
  isAdmin, 
  achievementController.deleteAchievement
);

router.put(
  '/:id/feature', 
  protect, 
  isAdmin, 
  achievementController.toggleFeaturedStatus
);

module.exports = router;