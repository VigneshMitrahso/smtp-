const { Pool } = require('pg');
const { verifyConnection } = require('../config/mailConfig');
require('dotenv').config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

async function verifyDatabase() {
  log.info('Checking database connection...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    log.success('Database connection successful');

    // Check if tables exist
    const tables = ['users', 'password_reset_tokens', 'email_logs'];
    let allTablesExist = true;

    for (const table of tables) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )`,
        [table]
      );

      if (result.rows[0].exists) {
        log.success(`Table '${table}' exists`);
      } else {
        log.error(`Table '${table}' does not exist`);
        allTablesExist = false;
      }
    }

    if (!allTablesExist) {
      log.warning('Some tables are missing. Run: npm run setup-db');
      return false;
    }

    // Check row counts
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      log.info(`Table '${table}' has ${result.rows[0].count} rows`);
    }

    return true;

  } catch (error) {
    log.error(`Database error: ${error.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

async function verifyMailServiceAPI() {
  log.info('Checking Mail Service API configuration...');

  try {
    const apiUrl = process.env.MAIL_SERVICE_URL;
    const apiKey = process.env.MAIL_SERVICE_API_KEY;

    if (!apiUrl) {
      log.error('MAIL_SERVICE_URL is not configured');
      return false;
    }

    if (!apiKey) {
      log.warning('MAIL_SERVICE_API_KEY is not set - requests may fail');
    }

    log.info(`Mail Service URL: ${apiUrl}`);
    log.info(`API Key: ${apiKey ? '✓ Configured' : '✗ Not set'}`);

    // Use the verifyConnection function from mailConfig
    const connected = await verifyConnection();
    
    if (connected) {
      log.success('Mail Service API connection successful');
      return true;
    } else {
      log.error('Failed to connect to Mail Service API');
      return false;
    }

  } catch (error) {
    log.error(`Mail Service API error: ${error.message}`);
    return false;
  }
}

function verifyEnvironment() {
  log.info('Checking environment variables...');

  const required = [
    'DATABASE_URL',
    'MAIL_SERVICE_URL',
    'MAIL_SERVICE_API_KEY',
    'SENDER_EMAIL',
    'SENDER_NAME'
  ];

  let allPresent = true;

  for (const env of required) {
    if (process.env[env]) {
      log.success(`${env} is set`);
    } else {
      log.error(`${env} is missing`);
      allPresent = false;
    }
  }

  return allPresent;
}

async function main() {
  console.log('\n' + colors.blue + '='.repeat(50));
  console.log('Mail Service Setup Verification');
  console.log('='.repeat(50) + colors.reset + '\n');

  const envOk = verifyEnvironment();
  console.log('');

  const dbOk = await verifyDatabase();
  console.log('');

  const mailApiOk = await verifyMailServiceAPI();
  console.log('');

  console.log(colors.blue + '='.repeat(50) + colors.reset);
  
  if (envOk && dbOk && mailApiOk) {
    log.success('All checks passed! Your mail service is ready to use.');
    console.log('\nStart the server with: npm start');
  } else {
    log.error('Some checks failed. Please fix the issues above.');
    
    if (!envOk) {
      console.log('\n→ Check your .env file');
    }
    if (!dbOk) {
      console.log('→ Run: npm run setup-db');
    }
    if (!mailApiOk) {
      console.log('→ Verify Mail Service API URL and ensure the service is running');
      console.log('→ Check API key in .env');
    }
  }
  
  console.log(colors.blue + '='.repeat(50) + colors.reset + '\n');
}

main();
