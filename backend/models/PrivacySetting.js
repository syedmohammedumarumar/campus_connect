const mongoose = require('mongoose');

const privacySettingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profileVisibility: {
    type: String,
    enum: ['public', 'connections', 'private'],
    default: 'public'
  },
  showEmail: {
    type: Boolean,
    default: true
  },
  showPhone: {
    type: Boolean,
    default: false
  },
  showConnections: {
    type: Boolean,
    default: true
  },
  showAchievements: {
    type: Boolean,
    default: true
  },
  allowConnectionRequests: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PrivacySetting', privacySettingSchema);