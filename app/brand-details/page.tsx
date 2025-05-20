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

// Default brand details
const defaultBrandDetails = {
  brandDetailsText: "",
  tone: "friendly",
}

export default function BrandDetailsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const fromExtraction = searchParams.get("fromExtraction") === "true"
  const fromPayment = searchParams.get("paymentComplete") === "true"
  const guideType = searchParams.get("guideType") || localStorage.getItem("styleGuidePlan") || "core"
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

  // Check payment status only once on component mount
  useEffect(() => {
    const isComplete = localStorage.getItem("styleGuidePaymentStatus") === "completed" || fromPayment
    setPaymentComplete(isComplete)
  }, [fromPayment])

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

  // Load saved brand details from session storage
  useEffect(() => {
    const savedDetails = sessionStorage.getItem("brandDetails")
    if (savedDetails) {
      try {
        const parsedDetails = JSON.parse(savedDetails)
        // Ensure all required fields have values by merging with defaults
        const updatedDetails = {
          ...defaultBrandDetails,
          ...parsedDetails,
          // Only default tone if missing
          tone: parsedDetails.tone || "friendly"
        }

        setBrandDetails(updatedDetails)

        // Update session storage with the validated details
        sessionStorage.setItem("brandDetails", JSON.stringify(updatedDetails))
      } catch (e) {
        console.error("Error parsing saved brand details:", e)
        // If there's an error parsing, ensure we save the default details
        sessionStorage.setItem("brandDetails", JSON.stringify(defaultBrandDetails))
        setBrandDetails(defaultBrandDetails)
      }
    } else {
      // If no saved details, initialize sessionStorage with default values
      sessionStorage.setItem("brandDetails", JSON.stringify(defaultBrandDetails))
      setBrandDetails(defaultBrandDetails)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Add validation for each field
    let validatedValue = value
    
    if (name === "name") {
      // Brand name: max 50 chars, no special chars
      validatedValue = value.replace(/[^a-zA-Z0-9\s-]/g, "").slice(0, 50)
    } else if (name === "description") {
      // Description: max 500 chars
      validatedValue = value.slice(0, 500)
    } else if (name === "audience") {
      // Audience: max 500 chars
      validatedValue = value.slice(0, 500)
    }
    
    // Validate the field
    validateField(name, validatedValue)
    
    setBrandDetails((prev) => {
      const updatedDetails = { ...prev, [name]: validatedValue }
      // Save to session storage
      sessionStorage.setItem("brandDetails", JSON.stringify(updatedDetails))
      return updatedDetails
    })
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

  // Add field validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Update validation function
  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = {}
    
    if (name === "name") {
      if (!value.trim()) {
        errors[name] = "Brand name is required"
      } else if (value.length > 50) {
        errors[name] = "Brand name must be 50 characters or less"
      }
    } else if (name === "description") {
      if (!value.trim()) {
        errors[name] = "Description is required"
      } else if (value.length > 500) {
        errors[name] = "Description must be 500 characters or less"
      }
    } else if (name === "audience") {
      if (!value.trim()) {
        errors[name] = "Target audience is required"
      } else if (value.length > 500) {
        errors[name] = "Target audience must be 500 characters or less"
      }
    }
    
    setFieldErrors(prev => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  // Update handleSelectChange to ensure tone is always set
  const handleSelectChange = (name: string, value: string) => {
    if (name === "tone" && !value) {
      value = "friendly" // Ensure tone always has a value
    }
    
    setBrandDetails((prev) => {
      const updatedDetails = { ...prev, [name]: value }
      // Save to session storage
      sessionStorage.setItem("brandDetails", JSON.stringify(updatedDetails))
      return updatedDetails
    })
  }

  // Update isFormValid function
  const isFormValid = () => {
    // Only require brandDetailsText to be non-empty
    return !!(brandDetails.brandDetailsText && brandDetails.brandDetailsText.trim().length > 0)
  }

  // Update the handleSubmit function to always generate a preview
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandDetails: brandDetails
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate")
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to generate")
      }

      // Save brand details and preview
      sessionStorage.setItem("brandDetails", JSON.stringify(brandDetails))
      sessionStorage.setItem("previewContent", data.preview)

      // Redirect to preview page
      router.push("/preview")
    } catch (error) {
      setLoading(false)
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 min-w-0 max-w-[180px] sm:max-w-none">
            <FileText className="h-5 w-5 flex-shrink-0" />
            <span className="text-lg font-semibold truncate whitespace-nowrap">Style Guide AI</span>
          </Link>
        </div>
      </header>
      <main
        className={`flex-1 container py-12 transition-opacity duration-500 ease-in-out ${fadeIn ? "opacity-100" : "opacity-0"}`}
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
                    <Label htmlFor="brandDetailsText">Description</Label>
                    <Textarea
                      id="brandDetailsText"
                      name="brandDetailsText"
                      placeholder="Nike is a leading sports brand, selling a wide range of workout products, services and experiences worldwide. Nike targets athletes and sports enthusiasts globally, focusing on those who want high-quality sportswear and equipment."
                      value={brandDetails.brandDetailsText || ""}
                      onChange={e => {
                        setBrandDetails(prev => ({ ...prev, brandDetailsText: e.target.value }))
                        e.target.style.height = "auto"
                        e.target.style.height = e.target.scrollHeight + "px"
                      }}
                      rows={4}
                      className="resize-none min-h-[40px] max-h-[200px]"
                      onFocus={e => setShowCharCount(true)}
                      onBlur={e => setShowCharCount(!!e.target.value)}
                    />
                    {showCharCount && (
                      <div className={`text-xs mt-1 ${brandDetails.brandDetailsText?.length > 450 ? 'text-yellow-600' : 'text-muted-foreground'}`}>{brandDetails.brandDetailsText?.length || 0}/500 characters</div>
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
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loading || !(brandDetails.brandDetailsText && brandDetails.brandDetailsText.trim().length > 0)} 
                    className="w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
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
