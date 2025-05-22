// Test script for Stripe webhook functionality
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    const envVars = {};
    envLines.forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.replace(/\\n/g, '\n');
          value = value.substring(1, value.length - 1);
        }
        envVars[key] = value;
      }
    });
    
    return envVars;
  } catch (err) {
    console.error('Error loading .env file:', err.message);
    return {};
  }
}

// Load environment variables
const env = loadEnv();

// Configuration - read from environment or prompt user to provide
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET || '';
if (!WEBHOOK_SECRET) {
  console.error('Error: STRIPE_WEBHOOK_SECRET is required. Please set it in your .env file or as an environment variable.');
  process.exit(1);
}

const WEBHOOK_URL = 'https://aistyleguide.com/api/webhook';
const WWW_WEBHOOK_URL = 'https://www.aistyleguide.com/api/webhook';

// Mock event payload
const mockEvent = {
  id: `evt_test_${Date.now()}`,
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  type: 'checkout.session.completed',
  data: {
    object: {
      id: `cs_test_${Date.now()}`,
      object: 'checkout.session',
      payment_status: 'paid',
      // Add more fields as needed
    }
  }
};

// Convert to string for signing
const payload = JSON.stringify(mockEvent);

// Sign the payload
function generateSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

// Test webhook with signature
function testWebhook(url) {
  const signature = generateSignature(payload, WEBHOOK_SECRET);
  
  console.log(`Testing webhook at: ${url}`);
  console.log(`Event type: ${mockEvent.type}`);
  console.log(`Payload size: ${payload.length} bytes`);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Stripe-Signature': signature
    }
  };
  
  const req = https.request(url, options, (res) => {
    console.log(`Status code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Response: ${data}`);
      console.log('---------------------------------------');
    });
  });
  
  req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
  });
  
  req.write(payload);
  req.end();
}

// Test both URLs
console.log('Starting webhook tests...');
testWebhook(WEBHOOK_URL);
setTimeout(() => testWebhook(WWW_WEBHOOK_URL), 2000); 