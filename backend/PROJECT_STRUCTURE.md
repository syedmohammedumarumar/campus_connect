# Campus Connect Project Structure

```
📁 campus-connect-project/
├── 📄 package.json             # Project configuration and dependencies
├── 📄 server.js               # Main application entry point
├── 📄 .gitignore             # Git ignore file
│
├── 📁 config/                 # Configuration files
│   └── 📄 database.js        # Database configuration
│
├── 📁 controllers/           # Route controllers
│   └── 📄 authController.js  # Authentication controller
│
├── 📁 middleware/            # Express middleware
│   ├── 📄 auth.js           # Authentication middleware
│   ├── 📄 errorHandler.js   # Error handling middleware
│   ├── 📄 rateLimiter.js    # Rate limiting middleware
│   └── 📄 validateInput.js  # Input validation middleware
│
├── 📁 models/               # Database models
│   └── 📄 User.js          # User model schema
│
├── 📁 routes/              # API routes
│   └── 📄 authRoutes.js   # Authentication routes
│
└── 📁 utils/              # Utility functions
    ├── 📄 generateOTP.js  # OTP generation utilities
    ├── 📄 sendEmail.js    # Email sending utilities
    └── 📄 verifyToken.js  # JWT token verification

```

## Project Overview

Campus Connect is a secure student networking API built with Node.js and Express. It features:

### Core Features
- User Authentication System
- Email Verification with OTP
- Rate Limiting
- JWT Token-based Authentication
- Input Validation
- Error Handling

### Technical Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: Integrated email functionality
- **Security Features**: Rate limiting, input validation, secure password handling

### Key Components

1. **Authentication System** (`controllers/authController.js`, `routes/authRoutes.js`)
   - User registration with email verification
   - Login with rate limiting
   - Password reset functionality
   - Session management

2. **Security Middleware** (`middleware/`)
   - Request validation
   - Rate limiting
   - Authentication checks
   - Error handling

3. **Data Models** (`models/`)
   - User schema with secure password handling
   - Account verification system
   - Session management

4. **Utilities** (`utils/`)
   - Email sending functionality
   - OTP generation and verification
   - Token management

### Security Features
- Password hashing
- Rate limiting on sensitive routes
- Input validation and sanitization
- JWT-based authentication
- Secure session handling