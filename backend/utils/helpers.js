// Pagination helper
exports.getPagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    skip
  };
};

// Calculate total pages
exports.getTotalPages = (total, limit) => {
  return Math.ceil(total / limit);
};

// Format user response (remove sensitive fields)
exports.formatUserResponse = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  
  delete userObj.password;
  delete userObj.otp;
  delete userObj.otpExpiry;
  delete userObj.__v;
  
  return userObj;
};

// Build search query
exports.buildSearchQuery = (searchTerm) => {
  if (!searchTerm) return {};
  
  return {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { rollNumber: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { branch: { $regex: searchTerm, $options: 'i' } },
      { skills: { $regex: searchTerm, $options: 'i' } },
      { interests: { $regex: searchTerm, $options: 'i' } }
    ]
  };
};

// Check if user can view profile based on privacy settings
exports.canViewProfile = (targetUser, currentUser, privacySettings, areConnected) => {
  // Own profile - always visible
  if (targetUser._id.toString() === currentUser._id.toString()) {
    return true;
  }
  
  // Admin can view all
  if (currentUser.isAdmin) {
    return true;
  }
  
  // Check privacy settings
  if (!privacySettings) {
    return true; // Default to public if no settings
  }
  
  switch (privacySettings.profileVisibility) {
    case 'public':
      return true;
    case 'connections':
      return areConnected;
    case 'private':
      return false;
    default:
      return true;
  }
};