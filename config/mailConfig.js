/**
 * Mail Service API Configuration
 * HTTP-based mail service replaces direct SMTP for better reliability
 */

/**
 * Get mail service configuration
 */
const getMailConfig = () => {
  const config = {
    apiUrl: (process.env.MAIL_SERVICE_URL || 'http://localhost:5001').replace(/\/+$/, ''),
    apiKey: process.env.MAIL_SERVICE_API_KEY,
    senderEmail: process.env.SENDER_EMAIL,
    senderName: process.env.SENDER_NAME || 'DB Nexus',
    async: true // Non-blocking: Mail service responds immediately (202) to prevent timeouts
  };

  // Validate required configuration
  if (!config.apiUrl) {
    throw new Error('MAIL_SERVICE_URL is required in environment variables');
  }

  if (!config.apiKey) {
    console.warn('⚠️  MAIL_SERVICE_API_KEY not set - requests may be rejected by the mail service');
  }

  return config;
};

/**
 * Verify Mail Service API connection
 */
const verifyConnection = async () => {
  try {
    const config = getMailConfig();
    const headers = {
      'Content-Type': 'application/json'
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    // Test connection with a simple health check or by checking the endpoint
    const response = await fetch(`${config.apiUrl}/api/mail/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Connection Test',
        html: '<p>Test</p>',
        fromName: config.senderName,
        async: true,
        test: true // Flag to indicate this is a test request
      })
    });

    if (response.ok || response.status === 400) {
      // 400 is acceptable for a test email - means API is reachable
      console.log('✓ Mail Service API connection verified successfully');
      console.log(`  Endpoint: ${config.apiUrl}/api/mail/send`);
      return true;
    }

    console.error(`✗ Mail Service API responded with status ${response.status}`);
    return false;
  } catch (error) {
    console.error('✗ Mail Service API connection failed:', error.message);
    return false;
  }
};

module.exports = {
  getMailConfig,
  verifyConnection
};
