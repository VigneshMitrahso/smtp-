# Mail Service Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT / FRONTEND                        │
│                    (Browser / Mobile App / API)                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP Requests
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER (server.js)                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Middleware: body-parser, error handlers                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────┬──────────────────────────────┬──────────────────────────┘
        │                              │
        ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│  /api/mail/*     │          │  /api/auth/*     │
│  (mailRoutes)    │          │  (authRoutes)    │
└────────┬─────────┘          └────────┬─────────┘
         │                              │
         ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│ mailController   │          │ authController   │
│  - handleSignup  │          │  - verifyToken   │
│  - handleForgot  │          │  - resetPassword │
└────────┬─────────┘          └────────┬─────────┘
         │                              │
         │      ┌──────────────────────┐│
         └──────►   MODELS LAYER       ││
                │                      ││
                │  ┌────────────────┐ ││
                │  │ userModel      │ ││
                │  │  - createUser  │ ││
                │  │  - findByEmail │ ││
                │  │  - updatePass  │ ││
                │  └────────────────┘ ││
                │                      ││
                │  ┌────────────────┐ ││
                │  │ resetTokenModel│ ││
                │  │  - createToken │ ││
                │  │  - findValid   │ ││
                │  │  - markUsed    │ ││
                │  └────────────────┘ ││
                │                      ││
                │  ┌────────────────┐ ││
                │  │ emailLogModel  │ ││
                │  │  - logEmail    │ ││
                │  │  - getStats    │ ││
                │  └────────────────┘ ││
                └──────────┬───────────┘│
                           │            │
         ┌─────────────────┴────────────┘
         │
         ▼
┌──────────────────┐          ┌──────────────────┐
│  mailService     │          │  database.js     │
│  - sendEmail     │          │  PostgreSQL Pool │
│  - signupEmail   │          │  Query Helper    │
│  - forgotEmail   │          └────────┬─────────┘
└────────┬─────────┘                   │
         │                             │
         ▼                             ▼
┌──────────────────┐          ┌──────────────────┐
│  SMTP Server     │          │  PostgreSQL DB   │
│ (mail.dbnexus.io)│          │  (mailService)   │
│                  │          │                  │
│  Sends Emails    │          │  ┌────────────┐  │
│  to Recipients   │          │  │   users    │  │
└──────────────────┘          │  └────────────┘  │
                              │  ┌────────────┐  │
                              │  │reset_tokens│  │
                              │  └────────────┘  │
                              │  ┌────────────┐  │
                              │  │email_logs  │  │
                              │  └────────────┘  │
                              └──────────────────┘
```

## 📊 Data Flow Diagrams

### Signup Flow

```
User Request
    │
    ▼
POST /api/mail/signup
{ email, name, password }
    │
    ▼
mailController.handleSignup()
    │
    ├─► Validate input (email format, required fields)
    │
    ├─► userModel.findUserByEmail()
    │       └─► Check if user exists
    │
    ├─► userModel.createUser()
    │       └─► Hash password with bcrypt
    │       └─► Insert into users table
    │       └─► Return user data
    │
    ├─► mailService.sendSignupEmail()
    │       └─► Create HTML template
    │       └─► Create nodemailer transporter
    │       └─► Send email via SMTP
    │       └─► Return messageId
    │
    ├─► emailLogModel.logEmail()
    │       └─► Insert log into email_logs table
    │
    └─► Return success response
            └─► { userId, email, name, messageId }
```

### Forgot Password Flow

```
User Request
    │
    ▼
POST /api/mail/forgot-password
{ email }
    │
    ▼
mailController.handleForgotPassword()
    │
    ├─► Validate input (email format)
    │
    ├─► userModel.findUserByEmail()
    │       └─► Find user in database
    │       └─► If not found, return success (security)
    │
    ├─► resetTokenModel.createResetToken()
    │       └─► Generate random token (crypto)
    │       └─► Calculate expiry time (current + 1 hour)
    │       └─► Insert into password_reset_tokens table
    │       └─► Return token and expiry
    │
    ├─► mailService.sendForgotPasswordEmail()
    │       └─► Create reset link with token
    │       └─► Create HTML template
    │       └─► Send email via SMTP
    │       └─► Return messageId
    │
    ├─► emailLogModel.logEmail()
    │       └─► Insert log into email_logs table
    │
    └─► Return success response
            └─► { email, messageId, tokenExpiresAt }
```

### Password Reset Flow

```
User clicks reset link
    │
    ▼
GET /api/auth/verify-token/:token
    │
    ├─► resetTokenModel.findValidResetToken()
    │       └─► Query token from database
    │       └─► Check if not used
    │       └─► Check if not expired
    │       └─► Return token data with user email
    │
    └─► Return { email, expiresAt }
            │
            ▼
    User enters new password
            │
            ▼
POST /api/auth/reset-password
{ token, newPassword }
    │
    ├─► Validate input (token, password length)
    │
    ├─► resetTokenModel.findValidResetToken()
    │       └─► Verify token is still valid
    │
    ├─► userModel.updatePassword()
    │       └─► Hash new password with bcrypt
    │       └─► Update users.password_hash
    │
    ├─► resetTokenModel.markTokenAsUsed()
    │       └─► Update token.used = TRUE
    │
    ├─► resetTokenModel.deleteUserTokens()
    │       └─► Delete all other tokens for user
    │
    └─► Return success response
            └─► { email }
```

## 🔄 Request-Response Cycle

### Example: Complete Signup Request

```
1. CLIENT
   ↓ POST /api/mail/signup
   ↓ Content-Type: application/json
   ↓ Body: { "email": "john@example.com", "name": "John", "password": "secure123" }

2. EXPRESS SERVER
   ↓ server.js receives request
   ↓ body-parser middleware parses JSON
   ↓ Routes to mailRoutes

3. ROUTER
   ↓ mailRoutes.js matches POST /signup
   ↓ Calls mailController.handleSignup

4. CONTROLLER
   ↓ mailController validates input
   ↓ Checks email format with regex
   ↓ Calls userModel.findUserByEmail()

5. MODEL (Database Check)
   ↓ userModel queries: SELECT * FROM users WHERE email = $1
   ↓ PostgreSQL returns: No user found
   ↓ Continues to create user

6. MODEL (Create User)
   ↓ userModel.createUser()
   ↓ bcrypt.hash(password, 10)
   ↓ INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)
   ↓ PostgreSQL returns: { id: 1, email: "john@example.com", ... }

7. SERVICE (Send Email)
   ↓ mailService.sendSignupEmail()
   ↓ Builds HTML template
   ↓ Creates nodemailer transporter
   ↓ transporter.sendMail()
   ↓ SMTP server sends email
   ↓ Returns: { messageId: "<abc@mail.dbnexus.io>" }

8. MODEL (Log Email)
   ↓ emailLogModel.logEmail()
   ↓ INSERT INTO email_logs (user_id, email_to, email_type, ...)
   ↓ PostgreSQL confirms insert

9. CONTROLLER (Response)
   ↓ Builds success response object
   ↓ res.status(201).json({ success: true, data: {...} })

10. EXPRESS SERVER
    ↓ Sends response to client
    ↓ Status: 201 Created
    ↓ Body: { "success": true, "message": "...", "data": {...} }

11. CLIENT
    ↓ Receives response
    ↓ Displays success message to user
```

## 🗂️ Layer Responsibilities

### Routes Layer
- **Purpose:** Define API endpoints and HTTP methods
- **Files:** `routes/mailRoutes.js`, `routes/authRoutes.js`
- **Responsibilities:**
  - Map URLs to controllers
  - Define HTTP methods (GET, POST, etc.)
  - Apply middleware (if needed)

### Controllers Layer
- **Purpose:** Handle HTTP requests and responses
- **Files:** `controllers/mailController.js`, `controllers/authController.js`
- **Responsibilities:**
  - Validate request input
  - Call appropriate models/services
  - Handle errors
  - Format and send responses
  - HTTP status codes

### Models Layer
- **Purpose:** Database operations and business logic
- **Files:** `models/userModel.js`, `models/resetTokenModel.js`, `models/emailLogModel.js`
- **Responsibilities:**
  - Database queries (CRUD)
  - Data validation
  - Business logic
  - Return formatted data

### Services Layer
- **Purpose:** External integrations and utilities
- **Files:** `services/mailService.js`
- **Responsibilities:**
  - Email sending logic
  - Template generation
  - Third-party API calls
  - Utility functions

### Config Layer
- **Purpose:** Configuration and setup
- **Files:** `config/database.js`, `config/mailConfig.js`
- **Responsibilities:**
  - Database connection
  - SMTP configuration
  - Environment variables
  - Connection pools

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. INPUT VALIDATION                                      │  │
│  │     - Email format validation                            │  │
│  │     - Required field checks                              │  │
│  │     - Password strength validation                       │  │
│  │     - SQL injection prevention (prepared statements)     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  2. PASSWORD SECURITY                                     │  │
│  │     - bcrypt hashing (salt rounds: 10)                   │  │
│  │     - Never store plain passwords                        │  │
│  │     - Password strength requirements                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  3. TOKEN SECURITY                                        │  │
│  │     - Cryptographically secure random tokens (32 bytes)  │  │
│  │     - Time-based expiration (1 hour)                     │  │
│  │     - One-time use tokens                                │  │
│  │     - Token invalidation after use                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  4. DATABASE SECURITY                                     │  │
│  │     - Connection pooling                                 │  │
│  │     - Prepared statements                                │  │
│  │     - Foreign key constraints                            │  │
│  │     - Indexes for performance                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  5. EMAIL SECURITY                                        │  │
│  │     - SSL/TLS encryption (port 465)                      │  │
│  │     - Authenticated SMTP                                 │  │
│  │     - Rate limiting (to be added)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  6. ERROR HANDLING                                        │  │
│  │     - Don't expose sensitive info in errors              │  │
│  │     - Log errors securely                                │  │
│  │     - Generic error messages to users                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Module Dependencies

```
server.js
├── express
├── body-parser
├── dotenv
├── routes/mailRoutes
│   └── controllers/mailController
│       ├── services/mailService
│       │   └── config/mailConfig
│       │       └── nodemailer
│       ├── models/userModel
│       │   ├── config/database
│       │   │   └── pg
│       │   └── bcrypt
│       └── models/emailLogModel
│           └── config/database
└── routes/authRoutes
    └── controllers/authController
        ├── models/resetTokenModel
        │   └── config/database
        └── models/userModel
```

## 🎯 Design Patterns Used

### 1. **MVC Pattern (Modified)**
- **Model:** Database operations (`models/`)
- **View:** JSON responses (no traditional views)
- **Controller:** Request handlers (`controllers/`)

### 2. **Service Layer Pattern**
- Separate business logic from controllers
- `services/mailService.js` handles email logic

### 3. **Repository Pattern**
- Models act as repositories for data access
- Abstraction layer between controllers and database

### 4. **Dependency Injection**
- Modules require what they need
- Easy to test and maintain

### 5. **Configuration Pattern**
- Centralized configuration in `config/`
- Environment variables via dotenv

## 🚀 Performance Considerations

### Database
- **Connection pooling:** Reuse connections
- **Indexes:** Fast lookups on email, tokens
- **Prepared statements:** Query optimization

### Email Sending
- **Async operations:** Non-blocking email sends
- **Connection reuse:** Nodemailer transporter pooling
- **Error handling:** Graceful degradation

### Server
- **Express middleware:** Efficient request processing
- **Error boundaries:** Prevent crashes
- **Graceful shutdown:** Clean resource cleanup

---

This architecture provides a solid foundation for a production-ready mail service with clear separation of concerns, security best practices, and scalability considerations.
