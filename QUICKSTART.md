# Quick Start Guide

Get your mail service up and running in 5 minutes!

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (running locally)
- SMTP credentials (already configured in .env)

## Step 1: Verify PostgreSQL is Running

```bash
# Test PostgreSQL connection
psql -U postgres -c "SELECT version();"
```

## Step 2: Create Database

```bash
# Connect to PostgreSQL and create database
psql -U postgres

# In psql prompt:
CREATE DATABASE mailService;
\q
```

Or use this one-liner:
```bash
psql -U postgres -c "CREATE DATABASE mailService;"
```

## Step 3: Install Dependencies (Already Done!)

```bash
npm install
```

## Step 4: Setup Database Tables

```bash
npm run setup-db
```

You should see:
```
✅ Database setup completed successfully!

Tables created:
  - users
  - password_reset_tokens
  - email_logs
```

## Step 5: Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

You should see:
```
Mail Service running on port 3000
Database: postgresql://postgres:password@localhost:5432/mailService
SMTP Host: mail.dbnexus.io
Sender Email: no-reply@dbnexus.io
✓ Database connected successfully
```

## Step 6: Test the API

### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-09-23T12:00:00.000Z"
}
```

### Test 2: Create User and Send Signup Email
```bash
curl -X POST http://localhost:3000/api/mail/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"name\":\"Test User\",\"password\":\"password123\"}"
```

Expected response:
```json
{
  "success": true,
  "message": "User created and signup email sent successfully",
  "data": {
    "userId": 1,
    "email": "test@example.com",
    "name": "Test User",
    "isVerified": false,
    "messageId": "<...>"
  }
}
```

### Test 3: Request Password Reset
```bash
curl -X POST http://localhost:3000/api/mail/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\"}"
```

Expected response includes a token with expiry time:
```json
{
  "success": true,
  "message": "Password reset email sent successfully",
  "data": {
    "email": "test@example.com",
    "messageId": "<...>",
    "tokenExpiresAt": "2026-09-23T13:00:00.000Z"
  }
}
```

### Test 4: Verify Database

```bash
# Connect to database
psql -U postgres -d mailService

# Check users
SELECT * FROM users;

# Check reset tokens
SELECT token, expires_at FROM password_reset_tokens;

# Exit
\q
```

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Make sure PostgreSQL is running:
```bash
# Windows
pg_ctl status

# Or check if service is running
Get-Service -Name postgresql*
```

### Database Does Not Exist
```
Error: database "mailService" does not exist
```

**Solution:** Create the database:
```bash
psql -U postgres -c "CREATE DATABASE mailService;"
```

### SMTP Connection Error
```
Error: Invalid login
```

**Solution:** Check your SMTP credentials in `.env` file.

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:** Change PORT in `.env` or kill the process using port 3000:
```bash
# Find process on port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Kill process (replace PID with actual process ID)
Stop-Process -Id PID
```

## Next Steps

- Review the full API documentation in `README.md`
- Test all endpoints using `test-api.http` file
- Customize email templates in `services/mailService.js`
- Add more features like email verification, multi-language support, etc.
- Implement rate limiting for production
- Set up proper logging and monitoring
- Add authentication middleware for protected routes

## Production Checklist

Before deploying to production:

- [ ] Change database password
- [ ] Use environment-specific .env files
- [ ] Enable HTTPS
- [ ] Implement rate limiting
- [ ] Add request validation middleware
- [ ] Set up proper error logging (e.g., Sentry)
- [ ] Configure CORS properly
- [ ] Add helmet.js for security headers
- [ ] Set up database backups
- [ ] Configure email retry logic
- [ ] Add monitoring and alerts
- [ ] Review and test all security features

## Support

If you encounter any issues:

1. Check the logs in the console
2. Review environment variables in `.env`
3. Verify database connection
4. Test SMTP settings
5. Check PostgreSQL logs

Happy coding! 🚀
