const { Pool } = require('pg');
const nodemailer = require('nodemailer');
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

async function verifySMTP() {
  log.info('Checking SMTP configuration...');

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.verify();
    log.success('SMTP connection successful');
    log.info(`SMTP Host: ${process.env.SMTP_HOST}`);
    log.info(`SMTP User: ${process.env.SMTP_USER}`);
    return true;

  } catch (error) {
    log.error(`SMTP error: ${error.message}`);
    return false;
  }
}

function verifyEnvironment() {
  log.info('Checking environment variables...');

  const required = [
    'DATABASE_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
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

  const smtpOk = await verifySMTP();
  console.log('');

  console.log(colors.blue + '='.repeat(50) + colors.reset);
  
  if (envOk && dbOk && smtpOk) {
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
    if (!smtpOk) {
      console.log('→ Verify SMTP credentials in .env');
    }
  }
  
  console.log(colors.blue + '='.repeat(50) + colors.reset + '\n');
}

main();
