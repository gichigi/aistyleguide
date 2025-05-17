"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, FileText, CreditCard, Loader2, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
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

// Process preview content to remove duplicate title/subtitle
const processPreviewContent = (content: string, brandName: string = "") => {
  const lines = content.split('\n');
  // Remove first h1 and subtitle if they match our header
  if (lines[0]?.startsWith('# ') && lines[0].includes(brandName)) {
    lines.splice(0, 2); // Remove title and subtitle
  }
  return lines.join('\n');
};

export default function PreviewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [fadeIn, setFadeIn] = useState(false)
  const [brandDetails, setBrandDetails] = useState<any>(null)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    // Load brand details
    const savedBrandDetails = sessionStorage.getItem("brandDetails")
    if (savedBrandDetails) {
      setBrandDetails(JSON.parse(savedBrandDetails))
    }

    // Trigger fade-in animation
    const timer = setTimeout(() => {
      setFadeIn(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (shouldRedirect) {
      router.push("/full-access")
    }
  }, [shouldRedirect, router])

  useEffect(() => {
    let isMounted = true

    const loadPreview = async () => {
      if (!brandDetails) return
      try {
        const preview = await renderStyleGuideTemplate({ brandDetails, useAIContent: false, templateType: 'preview' })
        if (isMounted) {
          setPreviewContent(preview)
        }
      } catch (error) {
        console.error("Error generating preview:", error)
        if (isMounted) {
          toast({
            title: "Preview generation failed",
            description: "Could not generate preview. Please try again later.",
            variant: "destructive",
          })
          setShouldRedirect(true)
        }
      }
    }

    loadPreview()

    return () => {
      isMounted = false
    }
  }, [brandDetails, toast])

  const handlePayment = async (guideType: 'core' | 'complete') => {
    try {
      setIsProcessingPayment(true);
      
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideType })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: "Could not process payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };

  // If no preview content yet, show loading state
  if (!previewContent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Loading preview...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 dark:border-gray-800">
        <div className="container px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 min-w-0 max-w-[180px] sm:max-w-none">
            <FileText className="h-5 w-5 flex-shrink-0" />
            <span className="text-lg font-semibold truncate whitespace-nowrap">Style Guide AI</span>
          </Link>
          {/*<div className="flex items-center">
            <div className="px-4 py-2 text-sm font-medium rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
              Preview
            </div>
          </div>*/}
        </div>
      </header>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="space-y-4">
            <DialogTitle>Complete your purchase</DialogTitle>
            <DialogDescription>
              Choose your style guide package
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
                  <h3 className="text-2xl font-bold">Core Style Guide</h3>
                  <div className="mt-1 text-3xl font-bold">$99</div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4 space-y-2">
                  <h4 className="font-semibold text-blue-700">25 Essential Rules</h4>
                  <p className="text-sm text-blue-600">Perfect for startups and small teams</p>
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
                    <span>Grammar & mechanics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Do's and don'ts with examples</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>PDF & Markdown formats</span>
                  </div>
                </div>

                <Button
                  onClick={() => handlePayment('core')}
                  disabled={isProcessingPayment}
                  className="w-full py-6"
                >
                  {isProcessingPayment ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Get Core Guide
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="complete" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">Complete Style Guide</h3>
                  <div className="mt-1 text-3xl font-bold">$149</div>
                </div>

                <div className="rounded-lg bg-purple-50 p-4 space-y-2">
                  <h4 className="font-semibold text-purple-700">99+ Comprehensive Rules</h4>
                  <p className="text-sm text-purple-600">Ideal for established brands and larger teams</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Everything in Core Guide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>99+ modern writing rules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Used by Apple, Spotify, BBC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Formatting standards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Unlimited downloads in multiple formats</span>
                  </div>
                </div>

                <Button
                  onClick={() => handlePayment('complete')}
                  disabled={isProcessingPayment}
                  className="w-full py-6"
                >
                  {isProcessingPayment ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Get Complete Guide
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="sm:justify-start">
            <Button
              variant="secondary"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className={`flex-1 container py-8 max-w-5xl transition-opacity duration-500 ease-in-out ${fadeIn ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/brand-details"
            className="inline-flex items-center gap-2 text-base font-medium px-4 py-2 rounded-md border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" /> Back to details
          </Link>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden dark:bg-gray-950 dark:border-gray-800 relative">
          <div className="p-8">
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="prose prose-slate dark:prose-invert max-w-none style-guide-content">
                <ContentWithFadeout>
                  <div dangerouslySetInnerHTML={{ __html: processPreviewContent(previewContent, brandDetails?.name) }} />
                </ContentWithFadeout>

                {/* Add paywall banner */}
                <div className="my-8 mb-28 p-6 border border-dashed border-amber-300 rounded-lg bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 text-center">
                  <h3 className="text-lg font-medium text-amber-800 dark:text-amber-400 mb-2">
                    You've reached the preview limit
                  </h3>
                  <p className="text-amber-700 dark:text-amber-500 mb-4">
                    Unlock the full style guide to see all writing rules, formatting tips, and examples.
                  </p>
                  <Button
                    onClick={() => setPaymentDialogOpen(true)}
                    className="w-full sm:w-auto text-lg py-6 px-6 text-base"
                  >
                    <CreditCard className="h-5 w-5 mr-2" /> Unlock Full Guide
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

