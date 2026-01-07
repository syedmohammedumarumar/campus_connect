/**
 * Role-based access control middleware
 * Checks if the authenticated user has admin privileges
 */

const isAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has admin role
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // User is admin, proceed to next middleware/controller
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in role verification',
      error: error.message
    });
  }
};

module.exports = { isAdmin };