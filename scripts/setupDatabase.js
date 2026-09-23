const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const setupDatabase = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔄 Setting up database...');
    console.log(`Connecting to: ${process.env.DATABASE_URL}`);

    // Read SQL file
    const sqlFilePath = path.join(__dirname, '../migrations/init.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute SQL
    await pool.query(sql);

    console.log('✅ Database setup completed successfully!');
    console.log('\nTables created:');
    console.log('  - users');
    console.log('  - password_reset_tokens');
    console.log('  - email_logs');
    console.log('\nIndexes and triggers created successfully.');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

setupDatabase();
