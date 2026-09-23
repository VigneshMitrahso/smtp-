# Mail Service API

A Node.js mail service application using Nodemailer for sending emails with PostgreSQL database integration. This service provides APIs for user signup, password reset emails, and complete token management.

## Features

- ✉️ Send welcome emails on user signup
- 🔐 Send password reset emails with secure tokens
- 💾 PostgreSQL database integration for user and token storage
- 📧 SMTP configuration via environment variables
- 🎨 Beautiful HTML email templates
- ✅ Email validation
- 🔒 Secure token generation and verification
- 📊 Email logging and tracking
- ⏰ Automatic token expiration
- 🔑 Password hashing with bcrypt

## Database Schema

### Tables:
- **users** - Store user accounts with email, name, and hashed passwords
- **password_reset_tokens** - Store reset tokens with expiration and usage tracking
- **email_logs** - Track all sent emails for auditing

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env` file (already configured)

3. **Setup PostgreSQL database:**

Make sure PostgreSQL is running and the database `mailService` exists:
```bash
# Create database (if not exists)
psql -U postgres -c "CREATE DATABASE mailService;"
```

4. **Run database migrations:**
```bash
npm run setup-db
```

This will create all necessary tables, indexes, and triggers.

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### 1. Signup Email & User Creation
Create a new user and send a welcome email.

**Endpoint:** `POST /api/mail/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User created and signup email sent successfully",
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "isVerified": false,
    "messageId": "<unique-message-id>"
  }
}
```

**Response (User Exists):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/mail/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"name\":\"John Doe\",\"password\":\"securePassword123\"}"
```

### 2. Forgot Password Email
Send a password reset email with a secure token stored in database.

**Endpoint:** `POST /api/mail/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully",
  "data": {
    "email": "user@example.com",
    "messageId": "<unique-message-id>",
    "tokenExpiresAt": "2026-09-23T13:00:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/mail/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\"}"
```

### 3. Verify Reset Token
Check if a reset token is valid and not expired.

**Endpoint:** `GET /api/auth/verify-token/:token`

**Response (Valid):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "email": "user@example.com",
    "expiresAt": "2026-09-23T13:00:00.000Z"
  }
}
```

**Response (Invalid):**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**cURL Example:**
```bash
curl http://localhost:3000/api/auth/verify-token/YOUR_TOKEN_HERE
```

### 4. Reset Password
Reset user password using a valid token.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "your-reset-token-here",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "email": "user@example.com"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"YOUR_TOKEN\",\"newPassword\":\"newSecurePassword123\"}"
```

### 5. Health Check Endpoints

**API Health:** `GET /`
```json
{
  "message": "Mail Service API is running",
  "endpoints": { ... }
}
```

**Database Health:** `GET /health`
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-09-23T12:00:00.000Z"
}
```

## Environment Variables

The following environment variables are configured in `.env`:



## Project Structure

```
mailService/
├── config/
│   ├── database.js             # PostgreSQL connection pool
│   └── mailConfig.js           # Nodemailer configuration
├── controllers/
│   ├── authController.js       # Token verification & password reset
│   └── mailController.js       # Signup & forgot password handlers
├── models/
│   ├── userModel.js            # User database operations
│   ├── resetTokenModel.js      # Reset token operations
│   └── emailLogModel.js        # Email logging operations
├── routes/
│   ├── authRoutes.js           # Auth-related routes
│   └── mailRoutes.js           # Mail-related routes
├── services/
│   └── mailService.js          # Email sending logic & templates
├── migrations/
│   └── init.sql                # Database schema
├── scripts/
│   └── setupDatabase.js        # Database setup script
├── .env                        # Environment variables
├── .gitignore                  # Git ignore file
├── package.json                # Dependencies
├── server.js                   # Main application file
├── test-api.http               # API test file
└── README.md                   # Documentation
```

## Testing the APIs

### Using cURL:

**Test Signup with User Creation:**
```bash
curl -X POST http://localhost:3000/api/mail/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"name\":\"Test User\",\"password\":\"password123\"}"
```

**Test Forgot Password:**
```bash
curl -X POST http://localhost:3000/api/mail/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\"}"
```

**Verify Token:**
```bash
curl http://localhost:3000/api/auth/verify-token/YOUR_TOKEN_HERE
```

**Reset Password:**
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"YOUR_TOKEN\",\"newPassword\":\"newPassword123\"}"
```

### Using Postman or Thunder Client:

1. Import the `test-api.http` file or create requests manually
2. Set method and URL
3. Set headers: `Content-Type: application/json`
4. Set body (raw JSON) with required fields

### Using test-api.http file:

If you have the REST Client extension in VS Code, you can click "Send Request" above each test case.

## Complete Workflow Example

1. **Create a user:**
```bash
POST /api/mail/signup
{
  "email": "john@example.com",
  "name": "John Doe",
  "password": "securePass123"
}
```
User receives a welcome email.

2. **User forgets password:**
```bash
POST /api/mail/forgot-password
{
  "email": "john@example.com"
}
```
User receives an email with reset link containing token.

3. **Verify the token (frontend can use this):**
```bash
GET /api/auth/verify-token/{token}
```

4. **Reset password:**
```bash
POST /api/auth/reset-password
{
  "token": "received-token-from-email",
  "newPassword": "newSecurePass456"
}
```

5. **Old tokens are invalidated** - User can now login with new password.

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request` - Invalid input or missing required fields
- `500 Internal Server Error` - Server or SMTP errors

## Security Notes

- Reset tokens are stored securely in the database with expiration times
- Tokens automatically expire after 1 hour (configurable via RESET_TOKEN_EXPIRY_HOURS)
- Passwords are hashed using bcrypt before storage
- Used tokens are marked and cannot be reused
- All tokens for a user are invalidated after password reset
- Email validation prevents invalid email addresses
- Password strength validation (minimum 8 characters)
- Database uses prepared statements to prevent SQL injection
- Forgot password endpoint doesn't reveal if user exists (security best practice)
- Use HTTPS in production
- Implement rate limiting to prevent email spam
- Keep .env file secure and never commit it to version control

## Database Features

- **Automatic timestamps** - created_at and updated_at fields
- **Indexes** - Optimized queries on email, tokens, and user_id
- **Foreign keys** - Data integrity with CASCADE delete
- **Triggers** - Automatic updated_at timestamp updates
- **Connection pooling** - Efficient database connections
- **Email logging** - Track all sent emails for auditing
- **Token cleanup** - Expired tokens can be cleaned periodically

## Dependencies

- **express**: Web framework
- **nodemailer**: Email sending library
- **dotenv**: Environment variable management
- **body-parser**: Request body parsing
- **pg**: PostgreSQL client for Node.js
- **bcrypt**: Password hashing
- **nodemon**: Development auto-reload (dev dependency)

## Database Queries Examples

You can query the database directly using psql:

```bash
# Connect to database
psql -U postgres -d mailService

# View all users
SELECT * FROM users;

# View reset tokens
SELECT * FROM password_reset_tokens;

# View email logs
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;

# Check expired tokens
SELECT * FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP;
```

## License

ISC
