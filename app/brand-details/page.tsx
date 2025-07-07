"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { ArrowLeft, FileText, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import Logo from "@/components/Logo"
import Header from "@/components/Header"
import { getBrandName } from "@/lib/utils"
import { createErrorDetails } from "@/lib/api-utils"
import { ErrorMessage } from "@/components/ui/error-message"

// Default brand details - standardized structure
const defaultBrandDetails = {
  brandName: "",
  description: "",
  tone: "friendly",
}

// Inline brand name extraction function
// Removed duplicate extraction logic - now using centralized getBrandName utility

export default function BrandDetailsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [processingStep, setProcessingStep] = useState<'idle' | 'processing' | 'complete'>('idle')
  const searchParams = useSearchParams()
  const fromExtraction = searchParams.get("fromExtraction") === "true"
  const fromPayment = searchParams.get("paymentComplete") === "true"
  const urlGuideType = searchParams.get("guideType")
  const [guideType, setGuideType] = useState(urlGuideType || "core")
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)
  const [showCharCount, setShowCharCount] = useState(false)

  // Initialize state with default values to ensure inputs are always controlled
  const [brandDetails, setBrandDetails] = useState({ ...defaultBrandDetails })

  // Trigger fade-in animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeIn(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Check payment status and guide type from localStorage
  useEffect(() => {
    const isComplete = localStorage.getItem("styleGuidePaymentStatus") === "completed" || fromPayment
    setPaymentComplete(isComplete)
    
    // If no URL param for guide type, check localStorage
    if (!urlGuideType) {
      const savedGuideType = localStorage.getItem("styleGuidePlan")
      if (savedGuideType) {
        setGuideType(savedGuideType)
      }
    }
  }, [fromPayment, urlGuideType])

  // Show toast if brand details were filled from extraction
  useEffect(() => {
    if (fromExtraction) {
      toast({
        title: "Brand details filled",
        description: "We filled the brand details from the website.",
        duration: 3500,
      })
    }
  }, [fromExtraction, toast])

  // Auto-resize textarea when content changes or on load
  useEffect(() => {
    const textarea = document.getElementById('description') as HTMLTextAreaElement
    if (textarea) {
      // Wait a bit for rendering to complete
      setTimeout(() => {
        textarea.style.height = "auto"
        textarea.style.height = textarea.scrollHeight + "px"
      }, 100)
    }
  }, [brandDetails.description])

  // Load brand details from URL params (from extraction or manual entry)
  useEffect(() => {
    const brandName = searchParams.get("brandName") || ""
    const description = searchParams.get("description") || ""
    
    console.log("[Brand Details] Loading from URL params:", { brandName, description })
    
    if (brandName || description) {
      // Pre-fill form with extracted/manual data
      const newDetails = {
        brandName,
        description,
        tone: "friendly"
      }
      console.log("[Brand Details] Setting form data:", newDetails)
      setBrandDetails(newDetails)
    } else {
      // Load saved details from localStorage if no URL params
      const savedDetails = localStorage.getItem("brandDetails")
      if (savedDetails) {
        try {
          const parsedDetails = JSON.parse(savedDetails)
          setBrandDetails({
            ...defaultBrandDetails,
            ...parsedDetails,
            tone: parsedDetails.tone || "friendly"
          })
        } catch (e) {
          console.error("Error parsing saved brand details:", e)
          setBrandDetails(defaultBrandDetails)
        }
      } else {
        setBrandDetails(defaultBrandDetails)
      }
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Add validation for each field
    let validatedValue = value
    
    if (name === "brandName") {
      // Brand name: max 50 chars, no special chars
      validatedValue = value.replace(/[^a-zA-Z0-9\s&-]/g, "").slice(0, 50)
    } else if (name === "description") {
      // Description: max 500 chars
      validatedValue = value.slice(0, 500)
    } else if (name === "audience") {
      // Audience: max 500 chars
      validatedValue = value.slice(0, 500)
    }
    
    setBrandDetails((prev) => ({ ...prev, [name]: validatedValue }))
  }

  // Add character count display component
  const CharacterCount = ({ value, max }: { value: string, max: number }) => {
    const count = value.length
    const isNearLimit = count > max * 0.8
    const isOverLimit = count > max
    
    return (
      <div className={`text-xs mt-1 ${isNearLimit ? 'text-yellow-600' : ''} ${isOverLimit ? 'text-red-600' : 'text-muted-foreground'}`}>
        {count}/{max} characters
      </div>
    )
  }

  // Only validate the main text field (brandDetailsText)
  const [mainError, setMainError] = useState("")
  const [apiError, setApiError] = useState<any>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const validateMainField = (value: string) => {
      if (!value.trim()) {
      setMainError("Please enter a brand description.");
      return false;
      } else if (value.length > 500) {
      setMainError("Description is too long.");
      return false;
    }
    setMainError("");
    return true;
  }

  // Update handleSelectChange to ensure tone is always set
  const handleSelectChange = (name: string, value: string) => {
    if (name === "tone" && !value) {
      value = "friendly" // Ensure tone always has a value
    }
    
    setBrandDetails((prev) => ({ ...prev, [name]: value }))
  }

  // Update isFormValid function
  const isFormValid = () => {
    // Only require description to be non-empty
    return !!(brandDetails.description && brandDetails.description.trim().length > 0)
  }

  // Enhanced handleSubmit with retry logic
  const generatePreview = async () => {
      // Use centralized brand name utility
      const brandName = getBrandName(brandDetails)

      // Map the simplified form data to the expected template processor format
      const detailsWithName = { 
        ...brandDetails, 
        name: brandName,
        // Use description directly
        description: brandDetails.description,
        // Set default audience since we no longer collect it separately
        audience: "general audience"
      }

    // Generate preview with enhanced error handling
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandDetails: detailsWithName })
      })

      if (!response.ok) {
        const errorData = await response.json()
      throw new Error(errorData.error || errorData.details || "Failed to generate preview")
      }

      const data = await response.json()
      if (!data.success) {
      throw new Error(data.error || data.details || "Failed to generate preview")
      }

      // Save brand details and preview
      console.log("[Brand Details] Saving to localStorage:", detailsWithName)
      localStorage.setItem("brandDetails", JSON.stringify(detailsWithName))
      localStorage.setItem("previewContent", data.preview)
      console.log("[Brand Details] Successfully saved brand details with extracted name")

    return data
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setProcessingStep('processing')
    setApiError(null) // Clear any previous errors

    try {
      // Show processing state for 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Generate preview
      await generatePreview()

      setProcessingStep('complete')
      
      // Brief pause to show completion
      await new Promise(resolve => setTimeout(resolve, 500))

      // Redirect to preview page
      router.push("/preview")
    } catch (error) {
      setLoading(false)
      setProcessingStep('idle')
      console.error("Error:", error)
      
      // Create enhanced error details
      const errorDetails = createErrorDetails(error)
      setApiError(errorDetails)
      
      // Don't show toast for API errors since we'll show the ErrorMessage component
      console.log("Enhanced error details:", errorDetails)
    }
  }

  // Retry function
  const handleRetry = async () => {
    setIsRetrying(true)
    setApiError(null)
    
    try {
      await generatePreview()
      
      // Success - redirect to preview
      router.push("/preview")
    } catch (error) {
      console.error("Retry failed:", error)
      const errorDetails = createErrorDetails(error)
      setApiError(errorDetails)
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        className={`flex-1 container py-8 transition-opacity duration-500 ease-in-out ${fadeIn ? "opacity-100" : "opacity-0"}`}
      >
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          {fromExtraction && (
            <></>
          )}

          <Card className="shadow-lg border-2 border-gray-200 bg-white/90">
            <CardHeader>
              <CardTitle>About the brand</CardTitle>
              <CardDescription>Tell us about the brand.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="brandName">Brand name (optional)</Label>
                    <Input
                      id="brandName"
                      name="brandName"
                      placeholder="e.g., Apple, Nike, Your Company"
                      value={brandDetails.brandName || ""}
                      onChange={handleChange}
                      className="text-base p-4 font-medium placeholder:text-gray-400 placeholder:font-medium"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave blank to auto-detect from description
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe your brand in a few sentences. What do you do? Who do you serve?"
                      value={brandDetails.description || ""}
                      onChange={e => {
                        const value = e.target.value.slice(0, 500) // Enforce max length
                        setBrandDetails(prev => ({ ...prev, description: value }))
                        validateMainField(value)
                        // Auto-adjust height
                        e.target.style.height = "auto"
                        e.target.style.height = e.target.scrollHeight + "px"
                      }}
                      rows={5}
                      className="resize-none min-h-[120px] leading-relaxed text-base p-4 font-medium placeholder:text-gray-400 placeholder:font-medium"
                      onFocus={e => setShowCharCount(true)}
                      onBlur={e => setShowCharCount(!!e.target.value)}
                    />
                    {showCharCount && (
                      <div className={`text-xs mt-1 ${brandDetails.description?.length >= 500 ? 'text-red-600 font-medium' : brandDetails.description?.length > 450 ? 'text-yellow-600' : 'text-muted-foreground'}`}>{brandDetails.description?.length || 0}/500 characters</div>
                    )}
                    {mainError && (
                      <div className="text-xs text-red-600 mt-1">{mainError}</div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tone">Preferred tone</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("tone", value)}
                      value={brandDetails.tone || "friendly"}
                      defaultValue="friendly"
                    >
                      <SelectTrigger id="tone" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Show enhanced error message */}
                {apiError && (
                  <ErrorMessage
                    error={apiError}
                    onRetry={apiError.canRetry ? handleRetry : undefined}
                    onDismiss={() => setApiError(null)}
                    isRetrying={isRetrying}
                  />
                )}
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loading || !!mainError || !brandDetails.description.trim() || brandDetails.description.length > 500} 
                    className="w-full sm:w-auto"
                  >
                    {processingStep === 'processing' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : processingStep === 'complete' ? (
                      <>
                        <svg className="mr-2 h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Complete
                      </>
                    ) : (
                      "Generate Style Guide"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
