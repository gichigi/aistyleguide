// Script to rotate Stripe webhook secret
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    return envContent.split('\n').reduce((acc, line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        acc[match[1]] = match[2] || '';
      }
      return acc;
    }, {});
  } catch (err) {
    console.error('Error loading .env file:', err.message);
    return {};
  }
}

// Update .env file with new secret
function updateEnvFile(newSecret) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the webhook secret line
    envContent = envContent.replace(
      /STRIPE_WEBHOOK_SECRET=.*/,
      `STRIPE_WEBHOOK_SECRET=${newSecret}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('Updated .env file with new webhook secret');
    return true;
  } catch (err) {
    console.error('Error updating .env file:', err.message);
    return false;
  }
}

// Helper function to make API requests to Stripe
function stripeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const env = loadEnv();
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;
    
    if (!STRIPE_SECRET_KEY) {
      return reject(new Error('STRIPE_SECRET_KEY not found'));
    }

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
          // Check for errors in the response
          if (parsedData.error) {
            console.log('API Error Details:', JSON.stringify(parsedData.error, null, 2));
            reject(new Error(parsedData.error.message || 'API error'));
          } else {
            resolve(parsedData);
          }
        } catch (e) {
          console.error('Raw Response:', responseData);
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
    console.log('Fetching webhooks from Stripe...');
    const webhooks = await stripeRequest('GET', '/v1/webhook_endpoints');
    console.log(`Found ${webhooks.data.length} webhooks`);
    webhooks.data.forEach(webhook => {
      console.log(`- ${webhook.id}: ${webhook.url} (${webhook.status})`);
    });
    return webhooks.data;
  } catch (error) {
    console.error('Error listing webhooks:', error.message);
    return [];
  }
}

// Manually create a new webhook with a new secret
async function createNewWebhook() {
  try {
    console.log('Creating a new webhook endpoint...');
    const data = `url=${encodeURIComponent('https://www.aistyleguide.com/api/webhook')}&enabled_events[]=checkout.session.completed&enabled_events[]=checkout.session.expired`;
    const result = await stripeRequest('POST', '/v1/webhook_endpoints', data);
    
    if (result.secret && result.id) {
      console.log(`Created new webhook: ${result.id}`);
      return { id: result.id, secret: result.secret };
    } else {
      throw new Error('No webhook details returned from Stripe API');
    }
  } catch (error) {
    console.error('Error creating webhook:', error.message);
    return null;
  }
}

// Rotate webhook secret (or fallback to creating a new one)
async function rotateWebhookSecret(webhookId) {
  try {
    console.log(`Rotating secret for webhook ${webhookId}...`);
    const result = await stripeRequest('POST', `/v1/webhook_endpoints/${webhookId}/secret`);
    
    if (result.secret) {
      console.log('Successfully rotated webhook secret');
      return result.secret;
    } else {
      console.error('No secret returned in response. Response:', JSON.stringify(result, null, 2));
      throw new Error('No secret returned from Stripe API');
    }
  } catch (error) {
    console.error(`Error rotating webhook secret:`, error.message);
    
    // Fallback: Try to create a new webhook instead
    console.log('Falling back to creating a new webhook...');
    const newWebhook = await createNewWebhook();
    
    if (newWebhook && newWebhook.secret) {
      return newWebhook.secret;
    }
    
    return null;
  }
}

// Main function
async function main() {
  console.log('Finding webhooks...');
  
  // List current webhooks
  const webhooks = await listWebhooks();
  
  // Find the correct webhook (www version)
  const targetWebhook = webhooks.find(webhook => 
    webhook.url === 'https://www.aistyleguide.com/api/webhook'
  );
  
  if (!targetWebhook) {
    console.log('Could not find the webhook endpoint. Creating a new one...');
    const newWebhook = await createNewWebhook();
    
    if (!newWebhook) {
      console.error('Failed to create a new webhook. Please check your Stripe dashboard.');
      process.exit(1);
    }
    
    // Update .env file with the new secret
    updateEnvFile(newWebhook.secret);
    
    console.log(`
-----------------------------------------------------
🔐 NEW WEBHOOK CREATED SUCCESSFULLY 🔐

Your new webhook secret is:
${newWebhook.secret}

Steps to complete:
1. The secret has been updated in your .env file
2. Update this secret in your Vercel environment variables
3. Close the GitHub security alert
-----------------------------------------------------
`);
    return;
  }
  
  console.log(`Found webhook: ${targetWebhook.id} (${targetWebhook.url})`);
  
  // Rotate the secret
  const newSecret = await rotateWebhookSecret(targetWebhook.id);
  
  if (!newSecret) {
    console.error('Failed to rotate webhook secret. Please try again or do it manually in the Stripe dashboard.');
    process.exit(1);
  }
  
  // Update .env file
  updateEnvFile(newSecret);
  
  console.log(`
-----------------------------------------------------
🔐 SECRET ROTATED SUCCESSFULLY 🔐

Your new webhook secret is:
${newSecret}

Steps to complete:
1. The secret has been updated in your .env file
2. Update this secret in your Vercel environment variables
3. Close the GitHub security alert
-----------------------------------------------------
`);
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
}); 