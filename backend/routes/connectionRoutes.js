const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const { protect } = require('../middleware/auth'); // ✅ FIXED: Changed from 'auth' to { protect }
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validateInput'); // ✅ FIXED: Changed from 'validateInput' to { validate }

// Validation rules
const sendRequestValidation = [
  param('receiverId')
    .isMongoId()
    .withMessage('Invalid receiver ID'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Message must not exceed 200 characters')
];

const requestIdValidation = [
  param('requestId')
    .isMongoId()
    .withMessage('Invalid request ID')
];

const connectionIdValidation = [
  param('connectionId')
    .isMongoId()
    .withMessage('Invalid connection ID')
];

const targetUserValidation = [
  param('targetUserId')
    .isMongoId()
    .withMessage('Invalid user ID')
];

// Routes

// @route   POST /api/connections/request/:receiverId
// @desc    Send connection request
// @access  Private
router.post(
  '/request/:receiverId',
  protect, // ✅ FIXED
  sendRequestValidation,
  validate, // ✅ FIXED
  connectionController.sendRequest
);

// @route   POST /api/connections/accept/:requestId
// @desc    Accept connection request
// @access  Private
router.post(
  '/accept/:requestId',
  protect, // ✅ FIXED
  requestIdValidation,
  validate, // ✅ FIXED
  connectionController.acceptRequest
);

// @route   POST /api/connections/reject/:requestId
// @desc    Reject connection request
// @access  Private
router.post(
  '/reject/:requestId',
  protect, // ✅ FIXED
  requestIdValidation,
  validate, // ✅ FIXED
  connectionController.rejectRequest
);

// @route   DELETE /api/connections/:connectionId
// @desc    Remove connection
// @access  Private
router.delete(
  '/:connectionId',
  protect, // ✅ FIXED
  connectionIdValidation,
  validate, // ✅ FIXED
  connectionController.removeConnection
);

// @route   GET /api/connections
// @desc    Get my connections
// @access  Private
router.get(
  '/',
  protect, // ✅ FIXED
  connectionController.getConnections
);

// @route   GET /api/connections/requests
// @desc    Get pending incoming requests
// @access  Private
router.get(
  '/requests',
  protect, // ✅ FIXED
  connectionController.getPendingRequests
);

// @route   GET /api/connections/sent
// @desc    Get sent requests
// @access  Private
router.get(
  '/sent',
  protect, // ✅ FIXED
  connectionController.getSentRequests
);

// @route   GET /api/connections/suggestions
// @desc    Get connection suggestions
// @access  Private
router.get(
  '/suggestions',
  protect, // ✅ FIXED
  connectionController.getSuggestions
);

// @route   GET /api/connections/mutual/:targetUserId
// @desc    Get mutual connections with another user
// @access  Private
router.get(
  '/mutual/:targetUserId',
  protect, // ✅ FIXED
  targetUserValidation,
  validate, // ✅ FIXED
  connectionController.getMutualConnections
);

module.exports = router;