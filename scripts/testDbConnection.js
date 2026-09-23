const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('\n🔍 Testing Database Connection...\n');
  
  // Try connection string first
  if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL);
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    try {
      const result = await pool.query('SELECT NOW() as current_time, version() as version');
      console.log('\n✅ Connection successful!');
      console.log('\nDatabase Info:');
      console.log('  Time:', result.rows[0].current_time);
      console.log('  Version:', result.rows[0].version.split('\n')[0]);
      
      // Test if database exists
      try {
        const dbCheck = await pool.query('SELECT current_database()');
        console.log('  Database:', dbCheck.rows[0].current_database);
      } catch (err) {
        console.log('  Database: Unable to check');
      }
      
      await pool.end();
      return true;
      
    } catch (error) {
      console.error('\n❌ Connection failed!');
      console.error('Error:', error.message);
      
      if (error.message.includes('password')) {
        console.log('\n💡 Password issue detected!');
        console.log('\nTo fix this:');
        console.log('1. Find your PostgreSQL password');
        console.log('2. Update DATABASE_URL in .env file');
        console.log('\nExample:');
        console.log('DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/mailService');
        console.log('\n--- OR use individual parameters ---\n');
        console.log('Comment out DATABASE_URL and add:');
        console.log('DB_HOST=localhost');
        console.log('DB_PORT=5432');
        console.log('DB_NAME=mailService');
        console.log('DB_USER=postgres');
        console.log('DB_PASSWORD=your_password');
      }
      
      if (error.message.includes('does not exist')) {
        console.log('\n💡 Database does not exist!');
        console.log('\nCreate it with:');
        console.log('psql -U postgres -c "CREATE DATABASE mailService;"');
      }
      
      await pool.end();
      return false;
    }
  } else {
    console.log('Using individual database parameters:');
    console.log('  Host:', process.env.DB_HOST || 'localhost');
    console.log('  Port:', process.env.DB_PORT || '5432');
    console.log('  Database:', process.env.DB_NAME || 'mailService');
    console.log('  User:', process.env.DB_USER || 'postgres');
    console.log('  Password:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
    
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'mailService',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });

    try {
      const result = await pool.query('SELECT NOW() as current_time, version() as version');
      console.log('\n✅ Connection successful!');
      console.log('\nDatabase Info:');
      console.log('  Time:', result.rows[0].current_time);
      console.log('  Version:', result.rows[0].version.split('\n')[0]);
      
      await pool.end();
      return true;
      
    } catch (error) {
      console.error('\n❌ Connection failed!');
      console.error('Error:', error.message);
      await pool.end();
      return false;
    }
  }
}

// Run test
testConnection().then(success => {
  if (success) {
    console.log('\n✅ Database connection is working!');
    console.log('You can now run: npm run setup-db\n');
  } else {
    console.log('\n❌ Please fix the database connection and try again.\n');
  }
  process.exit(success ? 0 : 1);
});
