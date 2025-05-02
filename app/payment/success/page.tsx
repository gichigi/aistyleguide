"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function SuccessPage() {
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
    sessionStorage.setItem("styleGuidePaymentStatus", "completed")
    sessionStorage.setItem("styleGuidePlan", guideType)

    // Start generation process
    const generateGuide = async () => {
      try {
        // Get brand details
        const brandDetails = sessionStorage.getItem("brandDetails")
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
        sessionStorage.setItem("generatedStyleGuide", data.styleGuide)
        
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-950 rounded-xl shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {generationStatus === 'generating' && "Generating your style guide..."}
            {generationStatus === 'complete' && "Style guide generated successfully!"}
            {generationStatus === 'error' && "Failed to generate style guide. Please try again."}
          </p>
          {generationStatus === 'generating' && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}