// Script to update Stripe webhook configuration
// Run with: node update-stripe-webhook.js

const https = require('https');
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

// Configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;
const CORRECT_WEBHOOK_URL = 'https://www.aistyleguide.com/api/webhook';

if (!STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

// Helper function to make API requests to Stripe
function stripeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2023-10-16'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve(parsedData);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// List all webhooks
async function listWebhooks() {
  try {
    const webhooks = await stripeRequest('GET', '/v1/webhook_endpoints');
    console.log('Current webhooks:');
    webhooks.data.forEach(webhook => {
      console.log(`- ${webhook.id}: ${webhook.url} (${webhook.status})`);
    });
    return webhooks.data;
  } catch (error) {
    console.error('Error listing webhooks:', error.message);
    return [];
  }
}

// Update webhook URL
async function updateWebhook(webhookId, newUrl) {
  try {
    const data = `url=${encodeURIComponent(newUrl)}`;
    const updatedWebhook = await stripeRequest('POST', `/v1/webhook_endpoints/${webhookId}`, data);
    console.log(`Updated webhook ${webhookId} to URL: ${updatedWebhook.url}`);
    return updatedWebhook;
  } catch (error) {
    console.error(`Error updating webhook ${webhookId}:`, error.message);
    return null;
  }
}

// Main function
async function main() {
  console.log('Checking Stripe webhook configuration...');
  
  // List current webhooks
  const webhooks = await listWebhooks();
  
  // Find webhooks with incorrect URL
  const incorrectWebhooks = webhooks.filter(webhook => 
    webhook.url === 'https://aistyleguide.com/api/webhook'
  );
  
  if (incorrectWebhooks.length === 0) {
    console.log('No webhooks with incorrect URL found.');
  } else {
    console.log(`Found ${incorrectWebhooks.length} webhooks with incorrect URL.`);
    
    // Update each webhook
    for (const webhook of incorrectWebhooks) {
      console.log(`Updating webhook ${webhook.id} from ${webhook.url} to ${CORRECT_WEBHOOK_URL}`);
      await updateWebhook(webhook.id, CORRECT_WEBHOOK_URL);
    }
  }
  
  console.log('Done!');
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
}); 