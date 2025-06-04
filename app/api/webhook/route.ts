import { NextResponse } from "next/server"
import Stripe from "stripe"

// Pick the right Stripe secret key and webhook secret based on STRIPE_MODE
type StripeMode = 'test' | 'live';
const mode = (process.env.STRIPE_MODE as StripeMode) || 'live';
const STRIPE_SECRET_KEY =
  mode === 'test'
    ? process.env.STRIPE_TEST_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET =
  mode === 'test'
    ? process.env.STRIPE_TEST_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET;

const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

// Log webhook event details for debugging
function logWebhookDetails(event: any, error?: any) {
  const timestamp = new Date().toISOString()
  const eventId = event?.id || 'unknown'
  const eventType = event?.type || 'unknown'
  
  console.log(`[${timestamp}] Webhook ${eventId} (${eventType}): ${error ? 'FAILED' : 'SUCCESS'}`)
  
  if (error) {
    console.error(`[${timestamp}] Error details:`, error.message)
  }
}

// Handle redirects from www to non-www domain
function normalizeWebhookUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Check if this is the www version
    if (urlObj.hostname === 'www.aistyleguide.com') {
      urlObj.hostname = 'aistyleguide.com'
      console.log(`Normalized webhook URL from ${url} to ${urlObj.toString()}`)
      return urlObj.toString()
    }
    return url
  } catch (e) {
    console.error('Failed to normalize URL:', e)
    return url
  }
}

export async function POST(request: Request) {
  // Get the original URL
  const originalUrl = request.url
  // Normalize the URL for logging purposes
  const normalizedUrl = normalizeWebhookUrl(originalUrl)
  
  // Get raw buffer for signature verification (critical for Stripe webhooks)
  const payload = await request.arrayBuffer()
  const payloadBuffer = Buffer.from(payload)
  const sig = request.headers.get("stripe-signature")
  
  console.log(`[${new Date().toISOString()}] Webhook received:`)
  console.log(`  Original URL: ${originalUrl}`)
  console.log(`  Normalized URL: ${normalizedUrl}`)

  if (!sig) {
    console.error("Missing stripe-signature header")
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  try {
    // Verify webhook signature using raw buffer
    const event = stripe.webhooks.constructEvent(
      payloadBuffer,
      sig,
      STRIPE_WEBHOOK_SECRET!
    )

    // Log successful verification
    console.log(`Webhook verified: ${event.id} (${event.type})`)

    switch (event.type) {
      case "checkout.session.completed":
        // Handle successful payment
        console.log("Payment successful:", event.data.object)
        // Implement your payment processing logic here
        break
      case "checkout.session.expired":
        // Handle expired session
        console.log("Session expired:", event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Log successful processing
    logWebhookDetails(event)
    
    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Webhook error:", err.message)
    
    // Log webhook processing failure
    try {
      // Try to parse the event even if signature verification failed
      const event = JSON.parse(payloadBuffer.toString())
      logWebhookDetails(event, err)
    } catch (parseErr) {
      console.error("Could not parse webhook payload:", parseErr)
    }
    
    return NextResponse.json({ 
      error: "Webhook handler failed", 
      message: err.message,
      url: normalizedUrl
    }, { status: 400 })
  }
} 