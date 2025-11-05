const User = require('../models/User');
const PrivacySetting = require('../models/PrivacySetting');
const cloudinary = require('../config/cloudinary');
const {
  getPagination,
  getTotalPages,
  formatUserResponse,
  buildSearchQuery,
  canViewProfile
} = require('../utils/helpers');

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Find user
    const user = await User.findById(id).select('-password -otp -otpExpiry');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get privacy settings
    const privacySettings = await PrivacySetting.findOne({ userId: id });

    // Check if viewing own profile
    const isOwnProfile = user._id.toString() === currentUser._id.toString();

    // Check if connected (we'll implement this in Phase 3, for now assume not connected)
    const areConnected = false; // TODO: Check actual connection status

    // Check if user can view this profile
    if (!isOwnProfile && !canViewProfile(user, currentUser, privacySettings, areConnected)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this profile'
      });
    }

    // Apply privacy filters
    let userData = formatUserResponse(user);
    
    if (!isOwnProfile && privacySettings) {
      if (!privacySettings.showEmail) delete userData.email;
      if (!privacySettings.showPhone) delete userData.phone;
    }

    // Track profile view (only if not own profile)
    if (!isOwnProfile) {
      await User.findByIdAndUpdate(
        id,
        {
          $addToSet: {
            profileViews: {
              viewerId: currentUser._id,
              viewedAt: new Date()
            }
          }
        },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      data: { user: userData }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/update
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      name,
      bio,
      phone,
      linkedIn,
      github,
      skills,
      interests,
      year,
      branch
    } = req.body;

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (phone) updateData.phone = phone;
    if (linkedIn) updateData.linkedIn = linkedIn;
    if (github) updateData.github = github;
    if (skills) updateData.skills = skills;
    if (interests) updateData.interests = interests;
    if (year) updateData.year = year;
    if (branch) updateData.branch = branch;

    // Handle profile picture upload
    if (req.file) {
      // Delete old image from cloudinary if exists
      const user = await User.findById(userId);
      if (user.profilePicture) {
        const publicId = user.profilePicture.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`student-network/profiles/${publicId}`);
      }
      updateData.profilePicture = req.file.path;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpiry');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: formatUserResponse(updatedUser) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete own account
// @route   DELETE /api/users/me
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Soft delete - mark as deleted instead of removing
    await User.findByIdAndUpdate(userId, {
      accountStatus: 'deleted'
    });

    // Delete profile picture from cloudinary
    const user = await User.findById(userId);
    if (user.profilePicture) {
      const publicId = user.profilePicture.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`student-network/profiles/${publicId}`);
    }

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track profile view
// @route   POST /api/users/:id/view
// @access  Private
exports.trackProfileView = async (req, res, next) => {
  try {
    const { id } = req.params;
    const viewerId = req.user._id;

    // Don't track if viewing own profile
    if (id === viewerId.toString()) {
      return res.status(200).json({
        success: true,
        message: 'Cannot track view on own profile'
      });
    }

    // Add profile view
    await User.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          profileViews: {
            viewerId: viewerId,
            viewedAt: new Date()
          }
        }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile view tracked'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get who viewed my profile
// @route   GET /api/users/me/profile-views
// @access  Private
exports.getProfileViews = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page, limit } = getPagination(req.query.page, req.query.limit);

    // Get user with profile views
    const user = await User.findById(userId)
      .populate({
        path: 'profileViews.viewerId',
        select: 'name rollNumber branch year profilePicture'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Sort by most recent and paginate
    const views = user.profileViews
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice((page - 1) * limit, page * limit);

    const total = user.profileViews.length;
    const totalPages = getTotalPages(total, limit);

    res.status(200).json({
      success: true,
      data: {
        views,
        meta: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search query
    const searchQuery = buildSearchQuery(q);

    // Find users
    const users = await User.find(searchQuery)
      .select('name rollNumber branch year profilePicture skills interests')
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments(searchQuery);
    const totalPages = getTotalPages(total, limit);

    res.status(200).json({
      success: true,
      data: {
        users: users.map(formatUserResponse),
        meta: {
          page,
          limit,
          total,
          totalPages,
          searchTerm: q
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Filter users
// @route   GET /api/users/filter
// @access  Private
exports.filterUsers = async (req, res, next) => {
  try {
    const { year, branch, skills, interests } = req.query;
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);

    // Build filter query
    const filterQuery = {};
    if (year) filterQuery.year = year;
    if (branch) filterQuery.branch = new RegExp(branch, 'i');
    if (skills) filterQuery.skills = { $in: skills.split(',') };
    if (interests) filterQuery.interests = { $in: interests.split(',') };

    // Find users
    const users = await User.find(filterQuery)
      .select('name rollNumber branch year profilePicture skills interests')
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments(filterQuery);
    const totalPages = getTotalPages(total, limit);

    res.status(200).json({
      success: true,
      data: {
        users: users.map(formatUserResponse),
        meta: {
          page,
          limit,
          total,
          totalPages,
          filters: { year, branch, skills, interests }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's connections
// @route   GET /api/users/:id/connections
// @access  Private
exports.getUserConnections = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // TODO: Implement in Phase 3 (Connection System)
    // For now, return empty array
    res.status(200).json({
      success: true,
      message: 'Connection system will be implemented in Phase 3',
      data: {
        connections: []
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update privacy settings
// @route   PUT /api/users/privacy
// @access  Private
exports.updatePrivacy = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      profileVisibility,
      showEmail,
      showPhone,
      showConnections,
      showAchievements,
      allowConnectionRequests
    } = req.body;

    // Build update object
    const updateData = {};
    if (profileVisibility) updateData.profileVisibility = profileVisibility;
    if (showEmail !== undefined) updateData.showEmail = showEmail;
    if (showPhone !== undefined) updateData.showPhone = showPhone;
    if (showConnections !== undefined) updateData.showConnections = showConnections;
    if (showAchievements !== undefined) updateData.showAchievements = showAchievements;
    if (allowConnectionRequests !== undefined) updateData.allowConnectionRequests = allowConnectionRequests;

    // Update or create privacy settings
    const privacySettings = await PrivacySetting.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: { privacySettings }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get privacy settings
// @route   GET /api/users/privacy
// @access  Private
exports.getPrivacy = async (req, res, next) => {
  try {
    const userId = req.user._id;

    let privacySettings = await PrivacySetting.findOne({ userId });

    // Create default if doesn't exist
    if (!privacySettings) {
      privacySettings = await PrivacySetting.create({ userId });
    }

    res.status(200).json({
      success: true,
      data: { privacySettings }
    });
  } catch (error) {
    next(error);
  }
};