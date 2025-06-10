"use client"

import React, { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [generationStatus, setGenerationStatus] = useState<'generating' | 'complete' | 'error'>('generating')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [guideType, setGuideType] = useState<string>('core')

  useEffect(() => {
    const sessionIdParam = searchParams.get("session_id")
    const guideTypeParam = searchParams.get("guide_type") || "core"
    
    setSessionId(sessionIdParam)
    setGuideType(guideTypeParam)
    
    // Fire Google Ads conversion event (required even with page load conversion)
    if (typeof window !== 'undefined' && window.gtag) {
      console.log('🎯 Firing Google Ads conversion event...')
      
      // Event snippet as required by Google Ads documentation
      window.gtag('event', 'conversion', {
        'send_to': 'AW-943197631'  // Your conversion will be matched automatically
      })
    }
    
    // Temporarily commented out for testing conversion tracking
    // if (!sessionIdParam) {
    //   toast({
    //     title: "Invalid session",
    //     description: "Could not verify payment status. Please try again.",
    //     variant: "destructive",
    //   })
    //   router.push("/preview")
    //   return
    // }

    // Store payment status and guide type
    localStorage.setItem("styleGuidePaymentStatus", "completed")
    localStorage.setItem("styleGuidePlan", guideTypeParam)

    // Start generation process
    const generateGuide = async () => {
      try {
        // Get brand details
        const brandDetails = localStorage.getItem("brandDetails")
        if (!brandDetails) {
          console.error("[Payment Success] No brand details found in localStorage")
          toast({
            title: "Session expired",
            description: "Please fill in your brand details again.",
            variant: "destructive",
          })
          // Redirect to brand details page with payment complete flag
          router.push("/brand-details?paymentComplete=true")
          return
        }

        console.log("[Payment Success] Found brand details, generating style guide...")
        
        // Parse and log the brand details
        const parsedBrandDetails = JSON.parse(brandDetails)
        console.log("[Payment Success] Parsed brand details:", parsedBrandDetails)
        console.log("[Payment Success] Sending to API with plan:", guideTypeParam)

        // Generate style guide
        const response = await fetch("/api/generate-styleguide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandDetails: parsedBrandDetails,
            plan: guideTypeParam
          })
        })

        if (!response.ok) {
          throw new Error("Failed to generate style guide")
        }

        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || "Failed to generate style guide")
        }

        // Save generated style guide
        localStorage.setItem("generatedStyleGuide", data.styleGuide)
        
        // Update status
        setGenerationStatus('complete')

        // Show success message
        toast({
          title: "Style guide generated!",
          description: "Redirecting you to your guide...",
        })

        // Redirect to full access page
        setTimeout(() => {
          router.push("/full-access")
        }, 1500)

      } catch (error) {
        console.error("Generation error:", error)
        setGenerationStatus('error')
        toast({
          title: "Generation failed",
          description: "Could not generate your style guide. Please try again.",
          variant: "destructive",
        })
      }
    }

    generateGuide()
  }, [router, searchParams, toast])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blue-50">
      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-8 text-center max-w-md mx-4">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          {generationStatus === 'generating' && (
            <>
              <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-75"></div>
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 relative z-10" />
            </>
          )}
          {generationStatus === 'complete' && (
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {generationStatus === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              
              <h1 className="text-xl font-semibold text-gray-900 mb-3">
                Don't worry - your payment went through!
              </h1>
              
              <div className="text-gray-600 text-sm mb-6 space-y-3">
                <p className="font-medium">We're having a technical issue generating your style guide.</p>
                <p>This happens occasionally and <strong>we'll fix this right away</strong>.</p>
                <p>Your purchase is secure and we have all your details.</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">📧 Get immediate help</h3>
                <p className="text-blue-800 text-sm mb-3">
                  Email our support team - we typically respond within 1-2 hours:
                </p>
                <a
                  href={`mailto:support@aistyleguide.com?subject=URGENT:%20Payment%20Successful%20-%20Style%20Guide%20Generation%20Failed&body=Hi%20AIStyleGuide%20Support%20Team,%0A%0AI%20just%20completed%20my%20payment%20but%20my%20style%20guide%20failed%20to%20generate.%0A%0ASession%20Details:%0A- Session ID: ${sessionId || 'Not available'}%0A- Guide Type: ${guideType}%0A- Time: ${new Date().toLocaleString()}%0A- URL: ${typeof window !== 'undefined' ? window.location.href : 'Not available'}%0A%0APlease%20help%20me%20get%20my%20style%20guide%20as%20soon%20as%20possible.%0A%0AThanks,%0A[Your%20Name]`}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Support Now
                </a>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ What we'll do</h3>
                <ul className="text-green-800 text-sm space-y-1">
                  <li>• Generate your style guide manually</li>
                  <li>• Send it to you within 24 hours</li>
                  <li>• Include all formats (PDF, Word, etc.)</li>
                  <li>• No additional charge required</li>
                </ul>
              </div>
            </>
          )}
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          {generationStatus === 'generating' && "Payment Successful!"}
          {generationStatus === 'complete' && "Style Guide Ready!"}
          {generationStatus === 'error' && "Generation Failed"}
        </h1>
        
        <p className="text-gray-600 text-sm mb-4">
          {generationStatus === 'generating' && "We're generating your personalized style guide now."}
          {generationStatus === 'complete' && "Your guide is ready! Taking you there now."}
          {generationStatus === 'error' && "We couldn't make your guide. Try again or contact support."}
        </p>
        
        {generationStatus === 'generating' && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-4">
              <p className="font-medium mb-1">This can take a couple of minutes</p>
              <p>Please don't close this window</p>
            </div>
            
            {/* Add guarantee for reassurance */}
            <div className="flex items-center justify-center gap-2 text-xs text-green-600 mt-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-medium">Protected by 30-day money-back guarantee</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}