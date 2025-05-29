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
  const [progress, setProgress] = useState(0)

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
          throw new Error("No brand details found")
        }

        // Generate style guide
        const response = await fetch("/api/generate-styleguide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandInfo: JSON.parse(brandDetails),
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
        setProgress(100)

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
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {generationStatus === 'generating' && (
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          )}
          {generationStatus === 'complete' && (
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {generationStatus === 'error' && (
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {generationStatus === 'generating' && "Payment Successful!"}
          {generationStatus === 'complete' && "Style Guide Ready!"}
          {generationStatus === 'error' && "Generation Failed"}
        </h1>
        
        <p className="text-gray-600 text-sm mb-6">
          {generationStatus === 'generating' && "Generating your personalized style guide..."}
          {generationStatus === 'complete' && "Your guide is ready! Taking you there now."}
          {generationStatus === 'error' && "We couldn't make your guide. Try again or contact support."}
        </p>
        
        {generationStatus === 'generating' && (
          <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-1000 ease-out rounded-full" 
              style={{width: `${Math.min(progress + 20, 85)}%`}}
            ></div>
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