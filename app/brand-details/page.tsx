"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"
import { ArrowLeft, FileText, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import Logo from "@/components/Logo"
import Header from "@/components/Header"
import VoiceTraitSelector from "@/components/VoiceTraitSelector"

// Default brand details
const defaultBrandDetails = {
  name: "",
  brandDetailsText: "",
  englishVariant: "american" as "american" | "british",
  formalityLevel: "Neutral", // Default to neutral
  readingLevel: "6-8" as "6-8" | "10-12" | "13+", // Default to general public (6-8=General Public, 10-12=Professional, 13+=Technical/Academic)
}



// Inline brand name extraction function
function extractBrandNameInline(brandDetailsText: string) {
  try {
    // Simple extraction logic - look for common patterns
    const text = brandDetailsText.trim()
    
    // Look for patterns like "Nike is a..." or "Apple creates..." - updated to handle ® symbols
    const patterns = [
      /^([A-Z][a-zA-Z0-9\s&®™©-]{1,30}?)\s+(?:is|are|was|were|creates?|makes?|provides?|offers?|specializes?)/i,
      /^([A-Z][a-zA-Z0-9\s&®™©-]{1,30}?)\s+(?:helps?|serves?|works?|focuses?)/i,
      /(?:company|brand|business|startup|organization)\s+(?:called|named)\s+([A-Z][a-zA-Z0-9\s&®™©-]{1,30})/i,
      /^([A-Z][a-zA-Z0-9\s&®™©-]{1,30}?)\s*[,.]?\s*(?:a|an|the)/i
    ]
    
    // Try each pattern
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        let brandName = match[1].trim()
        // Clean up trailing punctuation and symbols
        brandName = brandName.replace(/[®™©]*$/, '').trim()
        // Validate it's not too generic
        const genericWords = ['company', 'business', 'brand', 'startup', 'organization', 'team', 'we', 'our', 'this', 'that']
        if (!genericWords.includes(brandName.toLowerCase()) && brandName.length > 1) {
          return { success: true, brandName }
        }
      }
    }
    
    // Fallback: look for first capitalized word that's not too common
    const words = text.split(/\s+/)
    for (const word of words) {
      if (/^[A-Z][a-zA-Z0-9&®™©-]{1,20}$/.test(word)) {
        const cleanWord = word.replace(/[®™©]*$/, '').trim()
        const commonWords = ['The', 'This', 'That', 'Our', 'We', 'Company', 'Business', 'Brand', 'Team']
        if (!commonWords.includes(cleanWord)) {
          return { success: true, brandName: cleanWord }
        }
      }
    }
    
    // Final fallback
    return { success: true, brandName: "Your Brand" }
  } catch (error) {
    console.error("Brand name extraction failed:", error)
    return { success: true, brandName: "Your Brand" }
  }
}

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
  const [selectedTraits, setSelectedTraits] = useState<string[]>([])
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
    const textarea = document.getElementById('brandDetailsText') as HTMLTextAreaElement
    if (textarea) {
      // Wait a bit for rendering to complete
      setTimeout(() => {
        textarea.style.height = "auto"
        textarea.style.height = textarea.scrollHeight + "px"
      }, 100)
    }
  }, [brandDetails.brandDetailsText])

  // Load saved brand details from localStorage
  useEffect(() => {
    const savedDetails = localStorage.getItem("brandDetails")
    if (savedDetails) {
      try {
        const parsedDetails = JSON.parse(savedDetails)
        
        // Convert old numeric formalityLevel to string if needed
        let formalityLevelValue = parsedDetails.formalityLevel
        if (typeof formalityLevelValue === 'number') {
          const formalityLabels = ["Very Casual", "Casual", "Neutral", "Formal", "Very Formal"]
          formalityLevelValue = formalityLabels[formalityLevelValue] || "Neutral"
        }
        
        // Ensure all required fields have values by merging with defaults
        const updatedDetails = {
          ...defaultBrandDetails,
          ...parsedDetails,
          englishVariant: parsedDetails.englishVariant || "american",
          formalityLevel: formalityLevelValue || "Neutral",
          readingLevel: parsedDetails.readingLevel || "6-8",
        }

        setBrandDetails(updatedDetails)

        // Update localStorage with the validated details
        localStorage.setItem("brandDetails", JSON.stringify(updatedDetails))
      } catch (e) {
        console.error("Error parsing saved brand details:", e)
        // If there's an error parsing, ensure we save the default details
        localStorage.setItem("brandDetails", JSON.stringify(defaultBrandDetails))
        setBrandDetails(defaultBrandDetails)
      }
    } else {
      // If no saved details, initialize localStorage with default values
      localStorage.setItem("brandDetails", JSON.stringify(defaultBrandDetails))
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
      validateNameField(validatedValue)
    } else if (name === "description") {
      // Description: max 500 chars
      validatedValue = value.slice(0, 500)
    } else if (name === "audience") {
      // Audience: max 500 chars
      validatedValue = value.slice(0, 500)
    }
    
    setBrandDetails((prev) => {
      const updatedDetails = { ...prev, [name]: validatedValue }
      // Save to localStorage
      localStorage.setItem("brandDetails", JSON.stringify(updatedDetails))
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

  // Validate both name and description fields
  const [mainError, setMainError] = useState("");
  const [nameError, setNameError] = useState("");

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

  const validateNameField = (value: string) => {
    if (!value.trim()) {
      setNameError("Please enter a brand name.");
      return false;
    } else if (value.length > 50) {
      setNameError("Brand name is too long.");
      return false;
    }
    setNameError("");
    return true;
  }

  // Update isFormValid function
  const isFormValid = () => {
    // Need brand name, brand description and exactly 3 traits
    return (
      !!brandDetails.name?.trim() && 
      !!brandDetails.brandDetailsText.trim() && 
      selectedTraits.length === 3
    )
  }

  // Update the handleSubmit function to use inline brand name extraction instead of external API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setProcessingStep('processing')

    try {
      // Show processing state for 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Use the required brand name field
      const brandName = brandDetails.name?.trim() || ""

      // Map the simplified form data to the expected template processor format
      const detailsWithName = { 
        ...brandDetails, 
        name: brandName,
        // Map brandDetailsText to description for template processor compatibility
        description: brandDetails.brandDetailsText,
        // Set default audience since we no longer collect it separately
        audience: "general audience",
        traits: selectedTraits,
        englishVariant: brandDetails.englishVariant,
        formalityLevel: brandDetails.formalityLevel,
        readingLevel: brandDetails.readingLevel,
      }

      // Generate preview as before
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandDetails: detailsWithName })
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
      console.log("[Brand Details] Saving to localStorage:", detailsWithName)
      localStorage.setItem("brandDetails", JSON.stringify(detailsWithName))
      localStorage.setItem("selectedTraits", JSON.stringify(selectedTraits))
      localStorage.setItem("previewContent", data.preview)
      console.log("[Brand Details] Successfully saved brand details with extracted name")

      setProcessingStep('complete')
      
      // Brief pause to show completion
      await new Promise(resolve => setTimeout(resolve, 500))

      // Redirect to preview page
      router.push("/preview")
    } catch (error) {
      setLoading(false)
      setProcessingStep('idle')
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleVariantChange = (value: "american" | "british") => {
    setBrandDetails(prev => {
      const updated = { ...prev, englishVariant: value }
      localStorage.setItem("brandDetails", JSON.stringify(updated))
      return updated
    })
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
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Brand Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g. Nike"
                      value={brandDetails.name || ""}
                      onChange={handleChange}
                      className="text-base p-4 font-medium placeholder:text-gray-400 placeholder:font-medium"
                    />
                    {nameError && (
                      <div className="text-xs text-red-600 mt-1">{nameError}</div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="brandDetailsText">Description</Label>
                    <Textarea
                      id="brandDetailsText"
                      name="brandDetailsText"
                      placeholder="Describe your brand in a few sentences. What do you do? Who do you serve?"
                      value={brandDetails.brandDetailsText || ""}
                      onChange={e => {
                        const value = e.target.value.slice(0, 500) // Enforce max length
                        setBrandDetails(prev => ({ ...prev, brandDetailsText: value }))
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
                      <div className={`text-xs mt-1 ${brandDetails.brandDetailsText?.length > 450 ? 'text-yellow-600' : 'text-muted-foreground'}`}>{brandDetails.brandDetailsText?.length || 0}/500 characters</div>
                    )}
                    {mainError && (
                      <div className="text-xs text-red-600 mt-1">{mainError}</div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                    <div className="grid gap-2">
                      <Label htmlFor="englishVariant">Language</Label>
                      <Select
                        onValueChange={(val) => handleVariantChange(val as "american" | "british")}
                        value={brandDetails.englishVariant}
                      >
                        <SelectTrigger id="englishVariant" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="american">American English</SelectItem>
                          <SelectItem value="british">British English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="formalityLevel">Formality</Label>
                      <Select
                        onValueChange={(val) => {
                          setBrandDetails(prev => {
                            const updated = { ...prev, formalityLevel: val }
                            localStorage.setItem("brandDetails", JSON.stringify(updated))
                            return updated
                          })
                        }}
                        value={brandDetails.formalityLevel || "Neutral"}
                      >
                        <SelectTrigger id="formalityLevel" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Very Casual">Very Casual</SelectItem>
                          <SelectItem value="Casual">Casual</SelectItem>
                          <SelectItem value="Neutral">Neutral</SelectItem>
                          <SelectItem value="Formal">Formal</SelectItem>
                          <SelectItem value="Very Formal">Very Formal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="readingLevel">Reading Level</Label>
                      <Select
                        onValueChange={(val) => {
                          setBrandDetails(prev => {
                            const updated = { ...prev, readingLevel: val as "6-8" | "10-12" | "13+" }
                            localStorage.setItem("brandDetails", JSON.stringify(updated))
                            return updated
                          })
                        }}
                        value={brandDetails.readingLevel || "6-8"}
                      >
                        <SelectTrigger id="readingLevel" className="w-full [&>span]:text-left [&>span]:justify-start">
                          <SelectValue placeholder="Select reading level">
                            {brandDetails.readingLevel === "6-8" && "Grade 6-8"}
                            {brandDetails.readingLevel === "10-12" && "Grade 10-12"}
                            {brandDetails.readingLevel === "13+" && "Grade 13+"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6-8">Grade 6-8 (General Public)</SelectItem>
                          <SelectItem value="10-12">Grade 10-12 (Professional)</SelectItem>
                          <SelectItem value="13+">Grade 13+ (Technical/Academic)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                {/* Voice Trait Selector */}
                <div className="mt-8">
                  <Label className="text-base font-medium">Brand voice traits</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pick 3 traits that define the brand personality.
                  </p>
                  <div className="mt-4">
                    <VoiceTraitSelector onChange={setSelectedTraits} />
                  </div>
                </div>
                <div className="flex justify-end mt-8">
                  <Button 
                    type="submit" 
                    disabled={loading || !!mainError || !!nameError || !isFormValid()} 
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
