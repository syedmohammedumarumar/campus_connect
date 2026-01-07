const mongoose = require('mongoose');
const validator = require('validator');

const achievementSchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [20, 'Description must be at least 20 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  // Student Reference (from User model)
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required']
  },
  studentRollNumber: {
    type: String,
    required: [true, 'Student roll number is required']
  },

  // Academic Info (from User model)
  branch: {
    type: String,
    required: [true, 'Branch is required']
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    enum: ['1', '2', '3', '4']
  },

  // Project Details
  category: {
    type: String,
    enum: ['project', 'hackathon', 'research', 'competition', 'certification', 'publication'],
    default: 'project'
  },
  technologies: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length <= 10;
      },
      message: 'Cannot have more than 10 technologies'
    }
  },

  // Links
  githubLink: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return validator.isURL(v);
      },
      message: 'Invalid GitHub URL'
    }
  },
  liveLink: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return validator.isURL(v);
      },
      message: 'Invalid Live URL'
    }
  },

  // Media (Cloudinary URLs)
  images: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length <= 5;
      },
      message: 'Cannot upload more than 5 images'
    },
    default: []
  },

  // Engagement
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },

  // Admin Controls
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
achievementSchema.index({ branch: 1, year: 1, category: 1 });
achievementSchema.index({ featured: 1, createdAt: -1 });
achievementSchema.index({ studentId: 1 });
achievementSchema.index({ likes: 1 });

// Trim technologies array items
achievementSchema.pre('save', function(next) {
  if (this.technologies && this.technologies.length > 0) {
    this.technologies = this.technologies.map(tech => tech.trim());
  }
  next();
});

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;