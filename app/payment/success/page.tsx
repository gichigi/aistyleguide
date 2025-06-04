"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [generationStatus, setGenerationStatus] = useState<'generating' | 'complete' | 'error'>('generating')

  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    const guideType = searchParams.get("guide_type") || "core"
    
    if (!sessionId) {
      toast({
        title: "Invalid session",
        description: "Could not verify payment status. Please try again.",
        variant: "destructive",
      })
      router.push("/preview")
      return
    }

    // Store payment status and guide type
    localStorage.setItem("styleGuidePaymentStatus", "completed")
    localStorage.setItem("styleGuidePlan", guideType)

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
        console.log("[Payment Success] Sending to API with plan:", guideType)

        // Generate style guide
        const response = await fetch("/api/generate-styleguide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandDetails: parsedBrandDetails,
            plan: guideType
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
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">This can take a couple of minutes</p>
            <p>Please don't close this window</p>
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