const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 200,
    trim: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
});

// Compound index to ensure unique connection between two users
connectionSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

// Index for faster queries by status
connectionSchema.index({ status: 1 });

// Index for receiver's pending requests
connectionSchema.index({ receiverId: 1, status: 1 });

// Prevent self-connection
connectionSchema.pre('save', function(next) {
  if (this.senderId.equals(this.receiverId)) {
    return next(new Error('Cannot send connection request to yourself'));
  }
  next();
});

module.exports = mongoose.model('Connection', connectionSchema);