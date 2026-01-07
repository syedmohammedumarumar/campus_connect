const Achievement = require('../models/Achievement');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');
const cloudinary = require('../config/cloudinary');

/**
 * @desc    Get all achievements with filters and pagination
 * @route   GET /api/achievements
 * @access  Public
 */
const getAllAchievements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      branch,
      year,
      category,
      technologies,
      search,
      sortBy = 'recent'
    } = req.query;

    // Build filter object
    const filter = { status: 'approved' };

    if (branch) filter.branch = branch;
    if (year) filter.year = year;
    if (category) filter.category = category;
    
    // Filter by technologies (array)
    if (technologies) {
      const techArray = Array.isArray(technologies) ? technologies : [technologies];
      filter.technologies = { $in: techArray };
    }

    // Search in title and description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Determine sort order
    let sortOption = {};
    switch (sortBy) {
      case 'popular':
        sortOption = { 'likes': -1 }; // Most likes
        break;
      case 'trending':
        sortOption = { views: -1 }; // Most views
        break;
      case 'recent':
      default:
        sortOption = { createdAt: -1 }; // Most recent
        break;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Achievement.countDocuments(filter);
    
    // Fetch achievements
    const achievements = await Achievement.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('studentId', 'name rollNumber profilePicture')
      .lean();

    // Calculate total pages
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Achievements fetched successfully',
      data: {
        achievements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching achievements',
      error: error.message
    });
  }
};

/**
 * @desc    Get featured achievements
 * @route   GET /api/achievements/featured
 * @access  Public
 */
const getFeaturedAchievements = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const featuredAchievements = await Achievement.find({
      featured: true,
      status: 'approved'
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('studentId', 'name rollNumber profilePicture')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Featured achievements fetched successfully',
      data: featuredAchievements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching featured achievements',
      error: error.message
    });
  }
};

/**
 * @desc    Get trending achievements (most engagement in last N days)
 * @route   GET /api/achievements/trending
 * @access  Public
 */
const getTrendingAchievements = async (req, res) => {
  try {
    const { limit = 10, days = 7 } = req.query;

    // Calculate date from N days ago
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - parseInt(days));

    // Get achievements created in the last N days
    const achievements = await Achievement.find({
      status: 'approved',
      createdAt: { $gte: dateThreshold }
    })
      .populate('studentId', 'name rollNumber profilePicture')
      .lean();

    // Calculate trending score: (likes * 2) + views
    const trendingAchievements = achievements
      .map(achievement => ({
        ...achievement,
        trendingScore: (achievement.likes.length * 2) + achievement.views
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Trending achievements fetched successfully',
      data: trendingAchievements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trending achievements',
      error: error.message
    });
  }
};

/**
 * @desc    Get single achievement by ID
 * @route   GET /api/achievements/:id
 * @access  Public
 */
const getAchievementById = async (req, res) => {
  try {
    const { id } = req.params;

    const achievement = await Achievement.findById(id)
      .populate('studentId', 'name rollNumber profilePicture branch year')
      .lean();

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    // Check if current user has liked this achievement (if user is logged in)
    let isLikedByUser = false;
    if (req.user) {
      isLikedByUser = achievement.likes.some(
        likeId => likeId.toString() === req.user._id.toString()
      );
    }

    res.status(200).json({
      success: true,
      message: 'Achievement fetched successfully',
      data: {
        ...achievement,
        isLikedByUser
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching achievement',
      error: error.message
    });
  }
};

/**
 * @desc    Like/Unlike an achievement (Toggle)
 * @route   POST /api/achievements/:id/like
 * @access  Protected
 */
const likeAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const achievement = await Achievement.findById(id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    // Check if user already liked this achievement
    const likeIndex = achievement.likes.indexOf(userId);
    let liked = false;

    if (likeIndex > -1) {
      // User already liked, so unlike
      achievement.likes.splice(likeIndex, 1);
      liked = false;
    } else {
      // User hasn't liked, so add like
      achievement.likes.push(userId);
      liked = true;

      // Send notification to achievement owner (only if not self-like)
      if (achievement.studentId.toString() !== userId.toString()) {
        await createNotification({
          userId: achievement.studentId,
          type: 'achievement_liked',
          title: 'Someone liked your achievement',
          message: `${req.user.name} liked your achievement "${achievement.title}"`,
          relatedId: achievement._id,
          relatedModel: 'Achievement'
        });
      }
    }

    await achievement.save();

    res.status(200).json({
      success: true,
      message: liked ? 'Achievement liked successfully' : 'Achievement unliked successfully',
      data: {
        liked,
        totalLikes: achievement.likes.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while liking achievement',
      error: error.message
    });
  }
};

/**
 * @desc    View an achievement (increment view count)
 * @route   POST /api/achievements/:id/view
 * @access  Public
 */
const viewAchievement = async (req, res) => {
  try {
    const { id } = req.params;

    const achievement = await Achievement.findById(id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    // Increment view count
    achievement.views += 1;
    await achievement.save();

    res.status(200).json({
      success: true,
      message: 'View recorded successfully',
      data: {
        views: achievement.views
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while recording view',
      error: error.message
    });
  }
};

/**
 * @desc    Create new achievement (Admin only)
 * @route   POST /api/achievements
 * @access  Admin
 */
const createAchievement = async (req, res) => {
  try {
    const {
      title,
      description,
      studentId,
      category,
      technologies,
      githubLink,
      liveLink
    } = req.body;

    // Validate required fields
    if (!title || !description || !studentId || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        errors: ['title', 'description', 'studentId', 'category']
      });
    }

    // Verify student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Handle image uploads to Cloudinary
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      if (req.files.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'Cannot upload more than 5 images'
        });
      }

      // Upload each image to Cloudinary
      const uploadPromises = req.files.map(file => {
        return cloudinary.uploader.upload(file.path, {
          folder: 'achievements',
          resource_type: 'auto'
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      imageUrls = uploadResults.map(result => result.secure_url);
    }

    // Parse technologies array if it's a string
    let techArray = [];
    if (technologies) {
      techArray = Array.isArray(technologies) 
        ? technologies 
        : JSON.parse(technologies);
    }

    // Create achievement with auto-filled student data
    const achievement = await Achievement.create({
      title,
      description,
      studentId,
      studentName: student.name,
      studentRollNumber: student.rollNumber,
      branch: student.branch,
      year: student.year,
      category,
      technologies: techArray,
      githubLink,
      liveLink,
      images: imageUrls
    });

    // Notify student
    await createNotification({
      userId: studentId,
      type: 'achievement_added',
      title: 'New achievement added',
      message: `Admin added your achievement: ${title}`,
      relatedId: achievement._id,
      relatedModel: 'Achievement'
    });

    // Populate student data before sending response
    const populatedAchievement = await Achievement.findById(achievement._id)
      .populate('studentId', 'name rollNumber profilePicture');

    res.status(201).json({
      success: true,
      message: 'Achievement created successfully',
      data: populatedAchievement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while creating achievement',
      error: error.message
    });
  }
};

/**
 * @desc    Update achievement (Admin only)
 * @route   PUT /api/achievements/:id
 * @access  Admin
 */
const updateAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      technologies,
      githubLink,
      liveLink,
      removeImages
    } = req.body;

    const achievement = await Achievement.findById(id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    // Update text fields
    if (title) achievement.title = title;
    if (description) achievement.description = description;
    if (category) achievement.category = category;
    if (githubLink !== undefined) achievement.githubLink = githubLink;
    if (liveLink !== undefined) achievement.liveLink = liveLink;

    // Update technologies
    if (technologies) {
      const techArray = Array.isArray(technologies) 
        ? technologies 
        : JSON.parse(technologies);
      achievement.technologies = techArray;
    }

    // Handle image removal from Cloudinary
    if (removeImages && removeImages.length > 0) {
      const removeArray = Array.isArray(removeImages) 
        ? removeImages 
        : JSON.parse(removeImages);

      for (const imageUrl of removeArray) {
        // Extract public_id from Cloudinary URL
        const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
        
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error('Error deleting image from Cloudinary:', err);
        }

        // Remove from images array
        achievement.images = achievement.images.filter(img => img !== imageUrl);
      }
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const remainingSlots = 5 - achievement.images.length;
      
      if (req.files.length > remainingSlots) {
        return res.status(400).json({
          success: false,
          message: `Can only upload ${remainingSlots} more images (max 5 total)`
        });
      }

      // Upload new images to Cloudinary
      const uploadPromises = req.files.map(file => {
        return cloudinary.uploader.upload(file.path, {
          folder: 'achievements',
          resource_type: 'auto'
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      const newImageUrls = uploadResults.map(result => result.secure_url);
      
      achievement.images.push(...newImageUrls);
    }

    await achievement.save();

    // Populate and return updated achievement
    const updatedAchievement = await Achievement.findById(id)
      .populate('studentId', 'name rollNumber profilePicture');

    res.status(200).json({
      success: true,
      message: 'Achievement updated successfully',
      data: updatedAchievement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating achievement',
      error: error.message
    });
  }
};

/**
 * @desc    Delete achievement (Admin only)
 * @route   DELETE /api/achievements/:id
 * @access  Admin
 */
const deleteAchievement = async (req, res) => {
  try {
    const { id } = req.params;

    const achievement = await Achievement.findById(id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    // Delete all images from Cloudinary
    if (achievement.images && achievement.images.length > 0) {
      for (const imageUrl of achievement.images) {
        // Extract public_id from Cloudinary URL
        const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
        
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error('Error deleting image from Cloudinary:', err);
        }
      }
    }

    // Delete achievement from database
    await Achievement.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Achievement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting achievement',
      error: error.message
    });
  }
};

/**
 * @desc    Toggle featured status of achievement (Admin only)
 * @route   PUT /api/achievements/:id/feature
 * @access  Admin
 */
const toggleFeaturedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    if (typeof featured !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Featured must be a boolean value'
      });
    }

    const achievement = await Achievement.findById(id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    achievement.featured = featured;
    await achievement.save();

    // If featured, notify the owner
    if (featured) {
      await createNotification({
        userId: achievement.studentId,
        type: 'achievement_featured',
        title: 'Your achievement was featured!',
        message: `Your achievement "${achievement.title}" is now featured on the homepage`,
        relatedId: achievement._id,
        relatedModel: 'Achievement'
      });
    }

    // Populate and return updated achievement
    const updatedAchievement = await Achievement.findById(id)
      .populate('studentId', 'name rollNumber profilePicture');

    res.status(200).json({
      success: true,
      message: featured 
        ? 'Achievement featured successfully' 
        : 'Achievement unfeatured successfully',
      data: updatedAchievement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while toggling featured status',
      error: error.message
    });
  }
};

module.exports = {
  getAllAchievements,
  getFeaturedAchievements,
  getTrendingAchievements,
  getAchievementById,
  likeAchievement,
  viewAchievement,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  toggleFeaturedStatus
};