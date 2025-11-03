const crypto = require('crypto');

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  // Generate random 6-digit number
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

/**
 * Get OTP expiry time
 * @returns {Date} Expiry date
 */
const getOTPExpiry = () => {
  const minutes = parseInt(process.env.OTP_EXPIRE) || 10;
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = {
  generateOTP,
  getOTPExpiry
};