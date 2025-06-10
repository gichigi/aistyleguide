"use client"

import React, { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

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
          description: "Your guide is ready to view.",
        })

        // Don't auto-redirect anymore, let user click button
        // setTimeout(() => {
        //   router.push("/full-access?generated=true")
        // }, 1500)

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
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-lg ${
          generationStatus === 'error' 
            ? 'bg-gradient-to-br from-red-500 to-red-600' 
            : 'bg-gradient-to-br from-blue-500 to-blue-600'
        }`}>
          {generationStatus === 'generating' && (
            <>
              {/* Multiple pulsing rings for depth */}
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-2 bg-blue-300 rounded-full animate-ping opacity-30" style={{ animationDelay: '150ms' }}></div>
              
              {/* Solid white spinning icon */}
              <Loader2 className="h-10 w-10 animate-spin text-white relative z-10" />
            </>
          )}
          {generationStatus === 'complete' && (
            <svg className="w-10 h-10 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {generationStatus === 'error' && (
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-3">
          {generationStatus === 'generating' && "Payment Successful!"}
          {generationStatus === 'complete' && "🎉 Your Style Guide is Ready!"}
          {generationStatus === 'error' && "Generation Failed"}
        </h1>
        
        <p className="text-gray-600 text-sm mb-4">
          {generationStatus === 'generating' && "We're generating your personalized style guide now."}
          {generationStatus === 'complete' && "Your guide has been generated successfully!"}
          {generationStatus === 'error' && "We couldn't make your guide. Try again or contact support."}
        </p>
        
        {generationStatus === 'generating' && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-4">
              <p className="font-medium mb-1">This can take a couple of minutes</p>
              <p>Please don't close this window</p>
            </div>
            

          </div>
        )}

        {generationStatus === 'complete' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">Generation Complete</p>
              <p className="text-green-700 text-sm">Your style guide is ready to view and download.</p>
            </div>
            
            <Button 
              onClick={() => router.push("/full-access?generated=true")}
              className="w-full"
              size="lg"
            >
              View My Style Guide
            </Button>
          </div>
        )}

        {generationStatus === 'error' && (
          <div className="space-y-6">
            {/* Reassuring message */}
            <div className="space-y-2">
              <p className="text-base text-gray-700">
                Something went wrong during generation, but <strong>your payment was successful</strong>.
              </p>
              <p className="text-sm text-gray-600">
                We'll get this sorted for you right away.
              </p>
            </div>

            {/* Primary action - Try again */}
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                size="lg"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </Button>
              
              <p className="text-xs text-center text-gray-500">
                Most generation issues resolve with a simple retry
              </p>
            </div>

            {/* Support contact */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">
                Still having trouble?{' '}
                <a
                  href={`mailto:support@aistyleguide.com?subject=Payment%20Successful%20-%20Style%20Guide%20Generation%20Failed&body=Hi%20AIStyleGuide%20Support%20Team,%0A%0AI%20completed%20my%20payment%20but%20the%20style%20guide%20failed%20to%20generate.%0A%0ASession%20Details:%0A- Session ID: ${sessionId || 'Not available'}%0A- Guide Type: ${guideType}%0A- Time: ${new Date().toLocaleString()}%0A%0APlease%20help%20me%20get%20my%20style%20guide.%0A%0AThanks!`}
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Contact support
                </a>
              </p>
              <p className="text-xs text-gray-500">
                We typically respond within 1-2 hours
              </p>
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