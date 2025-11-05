const rateLimit = require('express-rate-limit');

// Auth routes rate limit (5 requests per 15 minutes)
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// OTP routes rate limit (3 requests per hour)
exports.otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limit (100 requests per 15 minutes)
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Search rate limit (30 requests per minute)
exports.searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many search requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});