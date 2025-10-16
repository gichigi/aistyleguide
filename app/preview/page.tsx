"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, CreditCard, Loader2, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { track } from "@vercel/analytics"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { renderStyleGuideTemplate } from "@/lib/template-processor"
import styled from "styled-components"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Logo from "@/components/Logo"
import { StyleGuideHeader } from "@/components/StyleGuideHeader"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import TraitCard from "@/components/TraitCard"
import VoiceTraitSelector from "@/components/VoiceTraitSelector"
import { TRAITS, type TraitName } from "@/lib/traits"

// Add fade-out effect before paywall
const ContentWithFadeout = styled.div`
  position: relative;
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 500px;
    background: linear-gradient(
      to bottom,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0) 40%,
      rgba(255,255,255,1) 100%
    );
    pointer-events: none;
  }
`;

interface BrandDetails {
  name: string
  description: string
  audience: string
  tone: string
  formalityLevel: string
  readingLevel: string
  englishVariant: string
}

interface Trait {
  id: string
  name: string
  type: 'predefined' | 'custom'
}

export default function PreviewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [brandDetails, setBrandDetails] = useState<BrandDetails | null>(null)
  const [selectedTraits, setSelectedTraits] = useState<Trait[]>([])
  const [guideContent, setGuideContent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  useEffect(() => {
    // Get brand details from localStorage
    const stored = localStorage.getItem('brandDetails')
    if (stored) {
      const details = JSON.parse(stored)
      setBrandDetails(details)
      
      // Get selected traits from localStorage
      const storedTraits = localStorage.getItem('selectedTraits')
      if (storedTraits) {
        setSelectedTraits(JSON.parse(storedTraits))
      }
      
      // Generate preview content
      generatePreviewContent(details)
    } else {
      // Redirect to brand details if no data
      router.push('/brand-details')
    }
  }, [router])

  const generatePreviewContent = async (details: BrandDetails) => {
    try {
      setIsLoading(true)
      setError(null)

      // Call the preview API to get AI-generated content
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandDetails: details,
          selectedTraits: selectedTraits
        }),
      })

      if (!response.ok) {
        throw new Error(`Preview generation failed: ${response.statusText}`)
      }

      const data = await response.json()
      setGuideContent(data)
    } catch (err) {
      console.error('Preview generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate preview')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async (guideType: 'core' | 'complete') => {
    if (!brandDetails) return

    try {
      setIsProcessingPayment(true)
      
      // Track payment button click
      track('Payment Started', { 
        guideType: guideType,
        price: guideType === 'core' ? 99 : 149,
        location: 'payment-dialog'
      });

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guideType: guideType,
          brandDetails: brandDetails,
          selectedTraits: selectedTraits
        }),
      })

      const data = await response.json()
      
      if (data.url) {
        // Store payment flow info
        localStorage.setItem("paymentFlow", "true")
        localStorage.setItem("selectedGuideType", guideType)
        
        // Redirect to Stripe
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Payment failed:', error)
      toast({
        title: "Payment failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (!brandDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading preview...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Generating your customized style guide preview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => generatePreviewContent(brandDetails)}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/brand-details" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Details
          </Link>
          <Logo />
        </div>
      </header>

      {/* Preview Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Your {brandDetails.name} Style Guide Preview</h1>
            <p className="text-gray-600 mb-6">
              Here's a preview of your customized brand voice traits. Each trait has been tailored specifically for your brand and audience.
            </p>

            {/* Selected Traits Section */}
            {selectedTraits.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Your Brand Voice Traits</h2>
                <VoiceTraitSelector 
                  selectedTraits={selectedTraits}
                  onTraitsChange={() => {}} // Read-only in preview
                  disabled={true}
                />
              </div>
            )}

            {/* Preview Content with Fade-out */}
            {guideContent && guideContent.preview && (
              <ContentWithFadeout>
                <div className="prose max-w-none">
                  <MarkdownRenderer content={guideContent.preview} />
                </div>
              </ContentWithFadeout>
            )}
          </div>
        </div>

        {/* Paywall Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Ready to unlock your complete style guide?</h2>
          <p className="mb-4 opacity-90">
            Get the full guide with all writing rules, examples, and professional formats.
          </p>
          <Button 
            onClick={() => setPaymentDialogOpen(true)}
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Unlock Style Guide
          </Button>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Choose Your Style Guide</DialogTitle>
            <DialogDescription>
              Select the plan that works best for your team and get instant access to your complete brand style guide.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="core" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="core">Core Guide</TabsTrigger>
              <TabsTrigger value="complete">Complete Guide</TabsTrigger>
            </TabsList>

            <TabsContent value="core" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold">Core Style Guide</h3>
                  <div className="mt-1 text-xl sm:text-3xl font-bold">$99</div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4 space-y-2">
                  <h4 className="font-semibold text-blue-700 text-base sm:text-lg">25 Essential Rules</h4>
                  <p className="text-xs sm:text-sm text-blue-600">Perfect for startups and small teams</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Brand voice definition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>25 essential writing rules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Professional formatting standards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>PDF download</span>
                  </div>
                </div>

                <Button 
                  onClick={() => handlePayment('core')}
                  disabled={isProcessingPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Get Core Guide - $99
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="complete" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold">Complete Style Guide</h3>
                  <div className="mt-1 text-xl sm:text-3xl font-bold">$149</div>
                </div>

                <div className="rounded-lg bg-purple-50 p-4 space-y-2">
                  <h4 className="font-semibold text-purple-700 text-base sm:text-lg">99+ Comprehensive Rules</h4>
                  <p className="text-xs sm:text-sm text-purple-600">Everything you need for professional content</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Everything in Core Guide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>99+ advanced writing rules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Professional templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Multiple download formats</span>
                  </div>
                </div>

                <Button 
                  onClick={() => handlePayment('complete')}
                  disabled={isProcessingPayment}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isProcessingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Get Complete Guide - $149
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>30-day money-back guarantee</span>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}