"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
  audience: "",
  englishVariant: "american" as "american" | "british",
  formalityLevel: "Neutral", // Default to neutral
  readingLevel: "6-8" as "6-8" | "10-12" | "13+", // Default to general public (6-8=General Public, 10-12=Professional, 13+=Technical/Academic)
}





// Format auto-populated descriptions with paragraph breaks between sentences
function formatAutoPopulatedDescription(description: string): string {
  if (!description || description.length < 20) {
    return description
  }
  
  // Split by sentence endings (., !, ?) but keep the punctuation
  const sentences = description.split(/(?<=[.!?])\s+/)
  
  // Join with double line breaks to create paragraphs
  return sentences
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0)
    .join('\n\n')
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
  const urlAudience = searchParams.get("audience") || ""
  const [guideType, setGuideType] = useState(urlGuideType || "core")
  const [selectedTraits, setSelectedTraits] = useState<string[]>([])
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)
  const [showCharCount, setShowCharCount] = useState(false)
  const descRef = useRef<HTMLTextAreaElement | null>(null)
  const keywordInputRef = useRef<HTMLTextAreaElement | null>(null)
  const [descriptionHeight, setDescriptionHeight] = useState<number>(144)
  const [email, setEmail] = useState("")
  const [sessionToken, setSessionToken] = useState("")
  const [showEmailCapture, setShowEmailCapture] = useState(false)

  // Initialize state with default values to ensure inputs are always controlled
  const [brandDetails, setBrandDetails] = useState({ ...defaultBrandDetails })
  const [keywordInput, setKeywordInput] = useState<string>("")
  const [keywordTags, setKeywordTags] = useState<string[]>([])
  const KEYWORD_LIMIT = 15

  // Trigger fade-in animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeIn(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Generate session token on component mount
  useEffect(() => {
    if (!sessionToken) {
      const token = crypto.randomUUID()
      setSessionToken(token)
      localStorage.setItem("emailCaptureToken", token)
    }
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
      setTimeout(() => {
        textarea.style.height = "auto"
        textarea.style.height = textarea.scrollHeight + "px"
        setDescriptionHeight(textarea.scrollHeight)
      }, 100)
    }
  }, [brandDetails.brandDetailsText])

  // Load saved brand details and email from localStorage
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
        
        // Format auto-populated descriptions with paragraph breaks (only for extracted content)
        let formattedBrandDetailsText = parsedDetails.brandDetailsText
        if (fromExtraction && formattedBrandDetailsText && formattedBrandDetailsText.length > 20) {
          formattedBrandDetailsText = formatAutoPopulatedDescription(formattedBrandDetailsText)
        }
        
        // Ensure all required fields have values by merging with defaults
        const updatedDetails = {
          ...defaultBrandDetails,
          ...parsedDetails,
          brandDetailsText: formattedBrandDetailsText || parsedDetails.brandDetailsText,
          englishVariant: parsedDetails.englishVariant || "american",
          formalityLevel: formalityLevelValue || "Neutral",
          readingLevel: parsedDetails.readingLevel || "6-8",
          audience: urlAudience || parsedDetails.audience || ""
        }

        setBrandDetails(updatedDetails)
        // Load saved keywords if present
        const savedKeywords = localStorage.getItem("brandKeywords")
        if (savedKeywords) {
          const parsed = savedKeywords
            .split(/\r?\n|,/) // support newlines or commas
            .map(k => k.trim())
            .filter(Boolean)
          setKeywordTags(parsed)
        }

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

    // Load saved email
    const savedEmail = localStorage.getItem("emailCapture")
    if (savedEmail) {
      try {
        const parsedEmail = JSON.parse(savedEmail)
        setEmail(parsedEmail.email || "")
      } catch (e) {
        console.error("Error parsing saved email:", e)
      }
    }
  }, [])

  // Persist keywords to localStorage when tags change
  useEffect(() => {
    try {
      localStorage.setItem("brandKeywords", keywordTags.join("\n"))
    } catch {}
  }, [keywordTags])

  const addKeyword = () => {
    const term = keywordInput.trim()
    if (!term) return
    if (keywordTags.includes(term)) {
      setKeywordInput("")
      return
    }
    if (keywordTags.length >= KEYWORD_LIMIT) return
    setKeywordTags(prev => [...prev, term])
    setKeywordInput("")
  }

  const removeKeyword = (term: string) => {
    setKeywordTags(prev => prev.filter(t => t !== term))
  }

  const addKeywordsBulk = (terms: string[]) => {
    const cleaned = terms
      .map(t => t.trim())
      .filter(Boolean)
      .filter(t => !keywordTags.includes(t))
    if (cleaned.length === 0) return
    const available = Math.max(0, KEYWORD_LIMIT - keywordTags.length)
    if (available === 0) return
    setKeywordTags(prev => [...prev, ...cleaned.slice(0, available)])
  }

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


  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
  };

  const handleEmailBlur = async () => {
    const trimmedEmail = email.trim();
    
    // Save email capture data to localStorage (for immediate UI)
    if (trimmedEmail && sessionToken) {
      const emailCaptureData = {
        sessionToken,
        email: trimmedEmail,
        capturedAt: Date.now(),
        brandDetails,
        paymentCompleted: false,
        emailsSent: []
      };
      localStorage.setItem("emailCapture", JSON.stringify(emailCaptureData));
      
      // Also save to server-side for abandoned cart tracking
      try {
        console.log('[Email Capture Client] Starting server-side storage...', {
          sessionToken: sessionToken?.substring(0, 8) + '***',
          email: trimmedEmail.substring(0, 3) + '***',
          timestamp: new Date().toISOString()
        });
        
        const response = await fetch('/api/capture-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionToken,
            email: trimmedEmail
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('[Email Capture Client] Successfully stored server-side:', {
            success: result.success,
            captureId: result.captureId,
            duration: result.duration
          });
        } else {
          const errorText = await response.text();
          console.error('[Email Capture Client] Failed to store server-side:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
        }
      } catch (error) {
        console.error('[Email Capture Client] Network error storing server-side:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    } else if (!trimmedEmail) {
      localStorage.removeItem("emailCapture");
      // Note: We don't delete from server-side as we want to track all attempts
    }
  };


  // Check if core form is ready (without email)
  const isCoreFormReady = () => {
    return (
      !!brandDetails.name?.trim() && 
      !!brandDetails.brandDetailsText.trim() && 
      selectedTraits.length === 3
    )
  }

  // Show email capture when core form is ready
  useEffect(() => {
    const formReady = isCoreFormReady()
    if (formReady && !showEmailCapture) {
      setShowEmailCapture(true)
      // Scroll to email section after a brief delay
      setTimeout(() => {
        const emailSection = document.getElementById('email-capture-section')
        if (emailSection) {
          emailSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
    } else if (!formReady && showEmailCapture) {
      setShowEmailCapture(false) // Reset if form becomes invalid
    }
  }, [brandDetails.name, brandDetails.brandDetailsText, selectedTraits.length])

  // Update isFormValid function - email is optional, no validation needed
  const isFormValid = () => {
    return isCoreFormReady()
  }

  // Handle the form submission
  const handleGenerateClick = (e: React.FormEvent) => {
    e.preventDefault()
    
    // If form is valid, proceed with generation
    if (isFormValid()) {
      handleSubmit(e)
    }
  }

  // Update the handleSubmit function to use inline brand name extraction instead of external API
  const handleSubmit = async (e: React.FormEvent) => {
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
        // Use extracted audience if present; otherwise leave empty (server will generate if needed)
        audience: brandDetails.audience || "",
        // Pass keywords (generated or user-edited) to backend
        keywords: keywordTags,
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
                    {/* Left: Description (span 2 columns to align with left + middle fields below) */}
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="brandDetailsText">Description</Label>
                      <Textarea
                        ref={descRef}
                        id="brandDetailsText"
                        name="brandDetailsText"
                        placeholder="Describe your brand in a few sentences. What do you do? Who do you serve?"
                        value={brandDetails.brandDetailsText || ""}
                        onChange={e => {
                          const value = e.target.value.slice(0, 500)
                          setBrandDetails(prev => {
                            const updatedDetails = { ...prev, brandDetailsText: value }
                            localStorage.setItem("brandDetails", JSON.stringify(updatedDetails))
                            return updatedDetails
                          })
                          validateMainField(value)
                          e.target.style.height = "auto"
                          e.target.style.height = e.target.scrollHeight + "px"
                          setDescriptionHeight(e.target.scrollHeight)
                        }}
                        rows={5}
                        className="resize-none min-h-[144px] leading-relaxed text-sm p-3 placeholder:text-gray-400"
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
                    {/* Right: Keywords (domain terms + lexicon) as tags */}
                    <div className="grid gap-2">
                      <Label htmlFor="keywordInput">Keywords (optional)</Label>
                      <p className="text-xs text-muted-foreground">To use in your writing examples</p>
                      {/* Tag list */}
                      <div
                        className="flex w-full max-h-48 overflow-y-auto rounded-md border border-input bg-background px-3 py-2 flex-wrap items-start gap-1 content-start"
                        style={{ minHeight: `${descriptionHeight}px` }}
                        onClick={() => keywordInputRef.current?.focus()}
                      >
                        {keywordTags.map(term => (
                          <span key={term} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 border hover:bg-gray-200">
                            {term}
                            <button type="button" aria-label={`Remove ${term}`} onClick={() => removeKeyword(term)} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                              ×
                            </button>
                          </span>
                        ))}
                        {/* Inline input (textarea for wrapping placeholder) */}
                        <textarea
                          ref={keywordInputRef}
                          aria-label="Add keyword"
                          placeholder={keywordTags.length === 0 ? "Add keywords" : "+ Keyword"}
                          value={keywordInput}
                          onChange={e => setKeywordInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); addKeyword(); }
                            else if (e.key === 'Backspace' && keywordInput === '') { removeKeyword(keywordTags[keywordTags.length - 1]); }
                            else if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
                              // paste handled in onPaste
                            }
                          }}
                          onPaste={e => {
                            const text = e.clipboardData.getData('text')
                            const parts = text.split(/\r?\n|,|\t/)
                            addKeywordsBulk(parts)
                            e.preventDefault()
                          }}
                          rows={1}
                          className={`${keywordTags.length === 0 ? 'w-full' : 'flex-1 min-w-[8rem]'} bg-transparent text-sm p-1.5 focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-muted-foreground resize-none whitespace-pre-wrap break-words`}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{keywordTags.length}/{KEYWORD_LIMIT} keywords</div>
                      {/* Input + Add button (counter/clear removed per design) */}
                    </div>
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
                            {brandDetails.readingLevel === "6-8" && "General Public"}
                            {brandDetails.readingLevel === "10-12" && "Professional"}
                            {brandDetails.readingLevel === "13+" && "Technical/Academic"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6-8">General Public</SelectItem>
                          <SelectItem value="10-12">Professional</SelectItem>
                          <SelectItem value="13+">Technical/Academic</SelectItem>
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

                {/* Email Capture Section - Progressive Disclosure */}
                {showEmailCapture && (
                  <div 
                    id="email-capture-section"
                    className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg transition-all duration-300 ease-in-out animate-in slide-in-from-top-2 fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="email" className="text-sm font-medium text-blue-900">
                          Email me a copy (optional)
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={handleEmailChange}
                          onBlur={handleEmailBlur}
                          className="mt-2 bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-8">
                  <Button 
                    onClick={handleGenerateClick}
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
                    ) : showEmailCapture ? (
                      "Generate Style Guide"
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
