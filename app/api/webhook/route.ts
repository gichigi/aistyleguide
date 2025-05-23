import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
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

// Handle redirects from non-www to www domain
function normalizeWebhookUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Check if this is the non-www version
    if (urlObj.hostname === 'aistyleguide.com') {
      urlObj.hostname = 'www.aistyleguide.com'
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
  
  const payload = await request.text()
  const sig = request.headers.get("stripe-signature")
  
  console.log(`[${new Date().toISOString()}] Webhook received:`)
  console.log(`  Original URL: ${originalUrl}`)
  console.log(`  Normalized URL: ${normalizedUrl}`)

  if (!sig) {
    console.error("Missing stripe-signature header")
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
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
      const event = JSON.parse(payload)
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