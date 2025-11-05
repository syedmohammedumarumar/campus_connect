const express = require("express");
const router = express.Router();

// Controllers
const {
  register,
  verifyOTP,
  resendOTP,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");

// Middleware
const { protect } = require("../middleware/auth");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiter");
const {
  registerValidation,
  verifyOTPValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  resendOTPValidation,
  validate
} = require("../middleware/validateInput");

// @route   POST /api/auth/register
// @desc    Register user & send OTP
// @access  Public
router.post(
  "/register",
  authLimiter,
  registerValidation,
  validate,
  register
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and complete registration
// @access  Public
router.post(
  "/verify-otp",
  otpLimiter,
  verifyOTPValidation,
  validate,
  verifyOTP
);

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post(
  "/resend-otp",
  otpLimiter,
  resendOTPValidation,
  validate,
  resendOTP
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  authLimiter,
  loginValidation,
  validate,
  login
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", protect, logout);

// @route   GET /api/auth/profile
// @desc    Get logged-in user profile
// @access  Private
router.get("/profile", protect, getProfile);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset OTP
// @access  Public
router.post(
  "/forgot-password",
  authLimiter,
  forgotPasswordValidation,
  validate,
  forgotPassword
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post(
  "/reset-password",
  authLimiter,
  resetPasswordValidation,
  validate,
  resetPassword
);

module.exports = router;