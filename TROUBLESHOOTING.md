# Troubleshooting Guide

## Common Issues and Solutions

### 1. Database Password Error

**Error:**
```
Error: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
```

**Cause:** The DATABASE_URL has an incorrect password or the word "password" is being used literally.

**Solution:**

#### Option A: Update DATABASE_URL with your actual PostgreSQL password
```env
# In .env file
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/mailService
```

Replace `YOUR_ACTUAL_PASSWORD` with your actual PostgreSQL password.

#### Option B: Use individual database parameters
Comment out DATABASE_URL and use individual parameters:

```env
# Comment this:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mailService

# Uncomment and use these:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mailService
DB_USER=postgres
DB_PASSWORD=your_actual_password
```

#### How to find your PostgreSQL password:

**If you don't know your password, reset it:**

```bash
# Connect as superuser
psql -U postgres

# In psql prompt, set a new password:
ALTER USER postgres PASSWORD 'newpassword';
\q
```

Then update your .env file with the new password.

### 2. Variable Scope Error

**Error:**
```
ReferenceError: email is not defined
```

**Solution:** ✅ Already fixed! The `email` variable is now declared outside the try-catch block.

### 3. Database Does Not Exist

**Error:**
```
error: database "mailService" does not exist
```

**Solution:**

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE mailService;"

# Then run migrations
npm run setup-db
```

### 4. PostgreSQL Not Running

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

**Check if PostgreSQL is running:**
```powershell
# Check PostgreSQL service status
Get-Service -Name postgresql*

# If not running, start it:
Start-Service postgresql-x64-16  # Replace with your version
```

**Or restart PostgreSQL:**
```powershell
Restart-Service postgresql-x64-16
```

### 5. Connection Timeout

**Error:**
```
Error: Connection terminated unexpectedly
```

**Solutions:**

1. **Check PostgreSQL is accepting connections:**
```bash
psql -U postgres -c "SELECT 1;"
```

2. **Check pg_hba.conf** (PostgreSQL config):
   - Location: `C:\Program Files\PostgreSQL\{version}\data\pg_hba.conf`
   - Ensure you have this line:
   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   ```

3. **Restart PostgreSQL after changes:**
```powershell
Restart-Service postgresql-x64-16
```

### 6. SMTP Connection Failed

**Error:**
```
Error: Invalid login
```

**Solutions:**

1. **Verify SMTP credentials in .env:**
   - Check SMTP_HOST
   - Check SMTP_USER
   - Check SMTP_PASS
   - Check SMTP_PORT

2. **Test SMTP connection:**
```bash
npm run verify
```

3. **Check firewall:** Ensure port 465 is not blocked.

### 7. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

**Option A: Change the port**
```env
# In .env
PORT=3001
```

**Option B: Kill the process using port 3000**
```powershell
# Find the process
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Kill it (replace PID with actual process ID)
Stop-Process -Id PID -Force
```

### 8. bcrypt Installation Error

**Error:**
```
Error: Cannot find module 'bcrypt'
or
node-pre-gyp install --fallback-to-build
```

**Solution:**

```bash
# Remove node_modules
Remove-Item -Recurse -Force node_modules

# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

If still failing, install bcrypt separately:
```bash
npm install bcrypt --save
```

### 9. Email Not Sending

**Checklist:**

1. **Verify SMTP settings:**
```bash
npm run verify
```

2. **Check email logs:**
```sql
psql -U postgres -d mailService
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 5;
```

3. **Check server logs for errors**

4. **Test with a simple SMTP test:**
```bash
# Use the test-api.http file to test signup
```

### 10. Tables Not Created

**Error:**
```
relation "users" does not exist
```

**Solution:**

```bash
# Run the database setup script
npm run setup-db
```

**Verify tables exist:**
```bash
psql -U postgres -d mailService

# In psql:
\dt

# Should show: users, password_reset_tokens, email_logs
```

## Quick Diagnostics

### Run Full System Check
```bash
npm run verify
```

This will check:
- ✅ Environment variables
- ✅ Database connection
- ✅ All tables exist
- ✅ SMTP connection

### Check Database Connection
```bash
psql -U postgres -d mailService -c "SELECT COUNT(*) FROM users;"
```

### Check Server Status
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

## Getting Help

### Enable Debug Logging

Add to .env:
```env
DEBUG=*
NODE_ENV=development
```

### Check Logs

**Console logs:** Check terminal where server is running

**Database logs:**
- Windows: `C:\Program Files\PostgreSQL\{version}\data\log\`

### Common Commands

```bash
# Check PostgreSQL version
psql --version

# Check Node version
node --version

# Check if database exists
psql -U postgres -l | findstr mailService

# View all environment variables
node -p "require('dotenv').config(); process.env"

# Test database query
psql -U postgres -d mailService -c "SELECT NOW();"
```

## Still Having Issues?

1. Check all environment variables are set correctly
2. Ensure PostgreSQL is running and accessible
3. Verify the database `mailService` exists
4. Run `npm run verify` to check setup
5. Check console logs for detailed error messages
6. Verify SMTP credentials are correct

## Contact Information

If you need additional help:
- Check the README.md for full documentation
- Review QUICKSTART.md for setup steps
- Check ARCHITECTURE.md for system design

## Common Configuration Issues

### Windows-Specific Issues

**PowerShell Execution Policy:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Path Issues:**
- Use forward slashes `/` or escaped backslashes `\\`
- Never use single backslash `\` in paths

**Line Endings:**
- Ensure .env file uses LF (Unix) line endings, not CRLF (Windows)
- In VS Code: Click "CRLF" in bottom right → Select "LF"

## Environment Variable Best Practices

1. **Never commit .env to git** (already in .gitignore)
2. **Use strong passwords** for production
3. **Use different credentials** for dev/prod
4. **Keep .env file secure** with proper permissions
5. **Document all variables** in .env.example

## Verification Checklist

Before running the app:

- [ ] PostgreSQL is installed and running
- [ ] Database `mailService` exists
- [ ] Tables are created (`npm run setup-db`)
- [ ] .env file has correct database password
- [ ] .env file has correct SMTP credentials
- [ ] All dependencies installed (`npm install`)
- [ ] Port 3000 is available (or changed in .env)
- [ ] Run `npm run verify` successfully

---

**Last Updated:** September 2026
