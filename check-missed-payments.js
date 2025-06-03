// Script to check for missed payments during webhook failures
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
// Use test keys if in test mode
const isTestMode = (process.env.STRIPE_MODE || env.STRIPE_MODE) === 'test';
const STRIPE_SECRET_KEY = isTestMode 
  ? (process.env.STRIPE_TEST_SECRET_KEY || env.STRIPE_TEST_SECRET_KEY)
  : (process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY);

if (!STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

console.log(`🔑 Using ${isTestMode ? 'TEST' : 'LIVE'} mode\n`);

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

// Get webhook endpoint ID
async function getWebhookEndpoint() {
  try {
    const webhooks = await stripeRequest('GET', '/v1/webhook_endpoints');
    return webhooks.data.find(wh => wh.url.includes('aistyleguide.com'));
  } catch (error) {
    console.error('Error getting webhook endpoint:', error.message);
    return null;
  }
}

// Check webhook delivery attempts for a payment
async function checkWebhookDeliveries(webhookId, paymentIntentId, created) {
  try {
    // Get events related to this payment
    const events = await stripeRequest('GET', `/v1/events?type=checkout.session.completed&created[gte]=${created - 300}&created[lte]=${created + 300}`);
    
    const relatedEvent = events.data.find(event => {
      const session = event.data.object;
      return session.payment_intent === paymentIntentId;
    });

    if (!relatedEvent) {
      return { delivered: false, attempts: 0, reason: 'No event found' };
    }

    // Check webhook attempts for this event
    const attempts = await stripeRequest('GET', `/v1/webhook_endpoints/${webhookId}/delivery_attempts?event=${relatedEvent.id}`);
    
    const successfulAttempt = attempts.data.find(attempt => attempt.response_status_code === 200);
    
    return {
      eventId: relatedEvent.id,
      delivered: !!successfulAttempt,
      attempts: attempts.data.length,
      lastAttempt: attempts.data[0],
      reason: successfulAttempt ? 'Delivered' : attempts.data[0]?.response_status_code || 'No attempts'
    };
  } catch (error) {
    return { delivered: false, attempts: 0, reason: `Error: ${error.message}` };
  }
}

// Main function to check missed payments
async function checkMissedPayments() {
  console.log('🔍 Checking for missed payments during webhook failures...\n');
  
  // Get webhook endpoint
  const webhook = await getWebhookEndpoint();
  if (!webhook) {
    console.error('❌ Could not find webhook endpoint');
    return;
  }
  
  console.log(`📡 Found webhook: ${webhook.url} (${webhook.status})\n`);
  
  // Get payments from the last 30 days (since May 22)
  const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  
  try {
    console.log('💳 Fetching successful payments from last 30 days...\n');
    
    const charges = await stripeRequest('GET', `/v1/charges?limit=100&created[gte]=${thirtyDaysAgo}&status=succeeded`);
    
    if (charges.data.length === 0) {
      console.log('✅ No payments found in the last 30 days');
      return;
    }
    
    console.log(`Found ${charges.data.length} successful payments. Checking webhook deliveries...\n`);
    
    let missedPayments = [];
    let totalChecked = 0;
    
    for (const charge of charges.data) {
      totalChecked++;
      const paymentDate = new Date(charge.created * 1000).toLocaleString();
      const amount = (charge.amount / 100).toFixed(2);
      const currency = charge.currency.toUpperCase();
      
      console.log(`[${totalChecked}/${charges.data.length}] Checking payment: ${charge.id} (${currency} ${amount}) - ${paymentDate}`);
      
      const webhookStatus = await checkWebhookDeliveries(webhook.id, charge.payment_intent, charge.created);
      
      if (!webhookStatus.delivered) {
        missedPayments.push({
          chargeId: charge.id,
          paymentIntent: charge.payment_intent,
          amount: `${currency} ${amount}`,
          date: paymentDate,
          customer: charge.billing_details?.email || 'No email',
          webhookStatus
        });
        console.log(`   ❌ WEBHOOK FAILED: ${webhookStatus.reason}`);
      } else {
        console.log(`   ✅ Webhook delivered successfully`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total payments checked: ${totalChecked}`);
    console.log(`Missed webhook deliveries: ${missedPayments.length}`);
    
    if (missedPayments.length > 0) {
      console.log('\n🚨 MISSED PAYMENTS:');
      console.log('-'.repeat(30));
      
      let totalMissedAmount = 0;
      missedPayments.forEach((payment, index) => {
        console.log(`${index + 1}. ${payment.chargeId}`);
        console.log(`   Amount: ${payment.amount}`);
        console.log(`   Date: ${payment.date}`);
        console.log(`   Customer: ${payment.customer}`);
        console.log(`   Webhook Status: ${payment.webhookStatus.reason}`);
        console.log(`   Event ID: ${payment.webhookStatus.eventId || 'N/A'}`);
        console.log('');
        
        // Extract numeric amount for total
        const numericAmount = parseFloat(payment.amount.split(' ')[1]);
        totalMissedAmount += numericAmount;
      });
      
      console.log(`💰 Total missed payment value: $${totalMissedAmount.toFixed(2)}`);
      console.log('\n⚠️  These customers may not have received their style guides!');
      console.log('Consider reaching out to them manually.');
    } else {
      console.log('\n🎉 Great news! No missed payments found.');
      console.log('All successful payments had working webhook deliveries.');
    }
    
  } catch (error) {
    console.error('Error checking payments:', error.message);
  }
}

// Run the script
checkMissedPayments().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
}); 