import { NextResponse } from "next/server"
import Stripe from "stripe"

// Define the correct API version type
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
})

// Ensure we use the www version of the URL
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.aistyleguide.com'

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
                ? 'Essential brand voice and tone guidelines'
                : 'Comprehensive guide with all brand elements',
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