# Campus Connect Project Structure

```
📁 backend/
├── 📄 package.json                    # Project configuration and dependencies
├── 📄 PROJECT_STRUCTURE.md           # Project structure documentation
├── 📄 server.js                      # Main application entry point
│
├── 📁 config/                        # Configuration files
│   ├── 📄 cloudinary.js              # Cloudinary configuration for image uploads
│   └── 📄 database.js                # Database configuration
│
├── 📁 controllers/                   # Route controllers
│   ├── 📄 authController.js          # Authentication controller
│   ├── 📄 connectionController.js    # Connection management controller
│   └── 📄 userController.js          # User management controller
│
├── 📁 middleware/                    # Express middleware
│   ├── 📄 auth.js                    # Authentication middleware
│   ├── 📄 errorHandler.js            # Error handling middleware
│   ├── 📄 rateLimiter.js             # Rate limiting middleware
│   ├── 📄 upload.js                  # File upload middleware
│   └── 📄 validateInput.js           # Input validation middleware
│
├── 📁 models/                        # Database models
│   ├── 📄 Connection.js              # Connection model schema
│   ├── 📄 Notification.js            # Notification model schema
│   ├── 📄 PrivacySetting.js          # Privacy setting model schema
│   └── 📄 User.js                    # User model schema
│
├── 📁 routes/                        # API routes
│   ├── 📄 authRoutes.js              # Authentication routes
│   ├── 📄 connectionRoutes.js        # Connection routes
│   └── 📄 userRoutes.js              # User routes
│
└── 📁 utils/                         # Utility functions
    ├── 📄 generateOTP.js             # OTP generation utilities
    ├── 📄 helpers.js                 # General helper functions
    ├── 📄 notificationHelper.js      # Notification helper utilities
    ├── 📄 sendEmail.js               # Email sending utilities
    └── 📄 verifyToken.js             # JWT token verification
```

## Project Overview

Campus Connect is a secure student networking API built with Node.js and Express. It features:

### Core Features
- User Authentication System with OTP verification
- Connection Management (friend requests, connections)
- User Profile Management
- Notification System
- Privacy Settings
- Image Upload via Cloudinary
- Email Notifications
- Rate Limiting and Input Validation

### Technical Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: Integrated email functionality
- **Image Storage**: Cloudinary
- **Security Features**: Rate limiting, input validation, secure password handling

### Key Components

1. **Authentication System** (`controllers/authController.js`, `routes/authRoutes.js`)
   - User registration with email verification
   - Login with rate limiting
   - Password reset functionality
   - Session management

2. **Connection Management** (`controllers/connectionController.js`, `routes/connectionRoutes.js`)
   - Send/receive connection requests
   - Accept/reject connections
   - View connections

3. **User Management** (`controllers/userController.js`, `routes/userRoutes.js`)
   - Profile updates
   - Privacy settings
   - User search and discovery

4. **Security Middleware** (`middleware/`)
   - Request validation
   - Rate limiting
   - Authentication checks
   - Error handling
   - File upload handling

5. **Data Models** (`models/`)
   - User schema with secure password handling
   - Connection schema
   - Notification schema
   - Privacy settings schema

6. **Utilities** (`utils/`)
   - Email sending functionality
   - OTP generation and verification
   - Token management
   - Notification helpers
   - General helpers

### Security Features
- Password hashing with bcrypt
- Rate limiting on sensitive routes
- Input validation and sanitization
- JWT-based authentication
- Secure session handling
- File upload restrictions