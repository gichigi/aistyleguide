import { NextResponse } from "next/server"
import Stripe from "stripe"

// Pick the right Stripe secret key based on STRIPE_MODE
type StripeMode = 'test' | 'live';
const mode = (process.env.STRIPE_MODE as StripeMode) || 'live';
const STRIPE_SECRET_KEY =
  mode === 'test'
    ? process.env.STRIPE_TEST_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
})

// Use the app URL from environment
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aistyleguide.com'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { guideType } = body

    // Log request info for debugging
    console.log(`Creating checkout session for guide type: ${guideType}`)
    console.log(`Using base URL: ${BASE_URL}`)

    // Validate guide type
    if (!['core', 'complete'].includes(guideType)) {
      return NextResponse.json(
        { error: 'Invalid guide type' },
        { status: 400 }
      )
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${guideType === 'core' ? 'Core' : 'Complete'} Style Guide`,
              description: guideType === 'core' 
                ? 'Unlock 25 essential brand writing rules and voice guidelines for clear, consistent content. Perfect for startups and small teams.'
                : 'Get the full brand style guide with 99+ advanced rules, voice traits, and pro content templates. Ideal for agencies and growing teams.',
            },
            unit_amount: guideType === 'core' ? 9900 : 14900, // $99 or $149
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&guide_type=${guideType}`,
      cancel_url: `${BASE_URL}/payment/cancel`,
    })

    console.log(`Checkout session created: ${session.id}`)
    
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 