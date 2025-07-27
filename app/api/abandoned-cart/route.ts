import { NextResponse } from "next/server"
import { supabase } from '@/lib/supabase'

// Generate discount code for abandoned cart recovery
function generateDiscountCode(): string {
  const codes = ['SAVE20', 'COMEBACK20', 'FINISH20', 'RETURN20', 'COMPLETE20'];
  return codes[Math.floor(Math.random() * codes.length)];
}

export async function GET(request: Request) {
  const startTime = Date.now()
  console.log(`[Abandoned Cart] Job started at ${new Date().toISOString()}`)
  
  try {
    const { searchParams } = new URL(request.url)
    const testMode = searchParams.get('test') === 'true'
    const timeThreshold = testMode ? 10 : 2 * 60 * 60 // 10 seconds for testing, 2 hours for production
    
    // Verify this is either a test request or a Vercel Cron request
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron') || 
                        request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
    
    if (!testMode && !isVercelCron) {
      console.warn('[Abandoned Cart] Unauthorized cron request - missing Vercel cron headers')
      return NextResponse.json(
        { error: 'Unauthorized - this endpoint is for Vercel Cron only' },
        { status: 401 }
      )
    }
    
    console.log(`[Abandoned Cart] Running in ${testMode ? 'TEST' : 'PRODUCTION'} mode ${isVercelCron ? '(Vercel Cron)' : '(Manual)'}`)
    console.log(`[Abandoned Cart] Looking for captures older than ${timeThreshold} seconds`)
    
    // Find abandoned email captures
    const cutoffTime = new Date(Date.now() - (timeThreshold * 1000))
    console.log(`[Abandoned Cart] Cutoff time: ${cutoffTime.toISOString()}`)
    
    const { data: abandonedCaptures, error } = await supabase
      .from('email_captures')
      .select('*')
      .eq('payment_completed', false)
      .eq('abandoned_email_sent', false)
      .lt('captured_at', cutoffTime.toISOString())
    
    if (error) {
      console.error('[Abandoned Cart] Error fetching abandoned captures:', error)
      return NextResponse.json(
        { error: 'Failed to fetch abandoned captures', details: error.message },
        { status: 500 }
      )
    }
    
    console.log(`[Abandoned Cart] Found ${abandonedCaptures.length} abandoned captures`)
    
    if (abandonedCaptures.length === 0) {
      const duration = Date.now() - startTime
      return NextResponse.json({
        success: true,
        message: 'No abandoned captures found',
        found: 0,
        processed: 0,
        duration: `${duration}ms`,
        testMode
      })
    }
    
    const results = []
    let successCount = 0
    let errorCount = 0
    
    // Process each abandoned capture
    for (const capture of abandonedCaptures) {
      try {
        console.log(`[Abandoned Cart] Processing capture: ${capture.session_token}, email: ${capture.email.substring(0, 3)}***`)
        
        const discountCode = generateDiscountCode()
        const recoveryUrl = `/brand-details?session=${capture.session_token}&discount=${discountCode}`
        
        // Send abandoned cart email using real email service
        console.log(`[Abandoned Cart] Sending abandoned cart email to ${capture.email.substring(0, 3)}*** with discount ${discountCode}`)
        console.log(`[Abandoned Cart] Recovery URL: ${recoveryUrl}`)
        
        // Import and use the real email service
        const { emailService } = await import('@/lib/email-service')
        const baseUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3002' 
          : (process.env.NEXT_PUBLIC_BASE_URL || 'https://aistyleguide.com')
        
        const emailResult = await emailService.sendAbandonedCartEmail({
          customerEmail: capture.email,
          customerName: undefined, // We don't have names from early capture
          recoveryUrl: `${baseUrl}${recoveryUrl}`, // Full URL for email
          discountCode,
          expiresAt: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours to use discount
        })
        
        if (emailResult.success) {
          // Mark this capture as having received an abandoned cart email
          await supabase
            .from('email_captures')
            .update({ abandoned_email_sent: true })
            .eq('session_token', capture.session_token)
          
          successCount++
          results.push({
            sessionToken: capture.session_token,
            email: capture.email.substring(0, 3) + '***',
            discountCode,
            recoveryUrl,
            emailId: emailResult.id,
            status: 'sent'
          })
          console.log(`[Abandoned Cart] ✅ Sent recovery email for session: ${capture.session_token}, emailId: ${emailResult.id}`)
        } else {
          errorCount++
          results.push({
            sessionToken: capture.session_token,
            email: capture.email.substring(0, 3) + '***',
            status: 'failed',
            error: emailResult.error || 'Email sending failed'
          })
          console.log(`[Abandoned Cart] ❌ Failed to send recovery email for session: ${capture.session_token}, error: ${emailResult.error}`)
        }
        
      } catch (error) {
        errorCount++
        console.error(`[Abandoned Cart] Error processing capture ${capture.session_token}:`, error)
        results.push({
          sessionToken: capture.session_token,
          email: capture.email.substring(0, 3) + '***',
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
    
    const duration = Date.now() - startTime
    console.log(`[Abandoned Cart] Job completed in ${duration}ms - Success: ${successCount}, Errors: ${errorCount}`)
    
    return NextResponse.json({
      success: true,
      message: `Processed ${abandonedCaptures.length} abandoned captures`,
      found: abandonedCaptures.length,
      processed: successCount + errorCount,
      successful: successCount,
      errors: errorCount,
      results,
      duration: `${duration}ms`,
      testMode,
      cutoffTime: cutoffTime.toISOString()
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[Abandoned Cart] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      },
      { status: 500 }
    )
  }
}

// This endpoint is now triggered by Vercel Cron every 2 hours
// Manual testing still available via: GET /api/abandoned-cart?test=true 