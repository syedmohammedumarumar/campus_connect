const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'connection_request',
      'connection_accepted',
      'connection_rejected',
      'new_message',
      'achievement_added',
      'profile_view',
      'admin_announcement',
      'achievement_liked',
      'mention'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  relatedModel: {
    type: String,
    enum: ['User', 'Connection', 'Message', 'Achievement', 'Announcement']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// Index for cleanup queries
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);