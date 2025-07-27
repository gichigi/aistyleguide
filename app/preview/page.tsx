"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, CreditCard, Loader2, CheckCircle } from "lucide-react"
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
import Logo from "@/components/Logo"
import { StyleGuideHeader } from "@/components/StyleGuideHeader"

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

// Process preview content to remove duplicate title/subtitle but keep How to Use section
const processPreviewContent = (content: string, brandName: string = "") => {
  if (!content) return content;
  
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // Remove the first paragraph that contains the date (May 29, 2025)
  const firstP = tempDiv.querySelector('p');
  if (firstP && firstP.textContent?.match(/\w+\s+\d{1,2},\s+\d{4}/)) {
    firstP.remove();
  }
  
  // Find and remove the first h1 that contains brand name or "Style Guide"
  const firstH1 = tempDiv.querySelector('h1');
  if (firstH1 && (
    (brandName && firstH1.textContent?.includes(brandName)) ||
    firstH1.textContent?.toLowerCase().includes('style guide')
  )) {
    firstH1.remove();
  }
  
  // Remove the subtitle paragraph "An essential guide..."
  const paragraphs = tempDiv.querySelectorAll('p');
  paragraphs.forEach(p => {
    if (p.textContent?.toLowerCase().includes('essential guide') || 
        p.textContent?.toLowerCase().includes('clear and consistent')) {
      p.remove();
    }
  });
  
  // Remove any horizontal divider lines (hr tags) that are orphaned
  const hrTags = tempDiv.querySelectorAll('hr');
  hrTags.forEach(hr => hr.remove());
  
  // Wrap "How to Use This Document" section in a callout
  const howToUseH2 = Array.from(tempDiv.querySelectorAll('h2')).find(h2 => 
    h2.textContent?.toLowerCase().includes('how to use this document')
  );
  if (howToUseH2) {
    const calloutDiv = document.createElement('div');
    calloutDiv.className = 'how-to-use-callout';
    
    // Move the h2 into the callout
    calloutDiv.appendChild(howToUseH2.cloneNode(true));
    
    // Move following paragraphs until we hit another h2
    let nextElement = howToUseH2.nextElementSibling;
    while (nextElement && nextElement.tagName.toLowerCase() !== 'h2') {
      const elementToMove = nextElement;
      nextElement = nextElement.nextElementSibling;
      calloutDiv.appendChild(elementToMove.cloneNode(true));
      elementToMove.remove();
    }
    
    // Replace the original h2 with the callout
    howToUseH2.parentNode?.replaceChild(calloutDiv, howToUseH2);
  }
  
  // Add divider and brand name to Brand Voice section
  const brandVoiceH2 = Array.from(tempDiv.querySelectorAll('h2')).find(h2 => 
    h2.textContent?.toLowerCase().includes('brand voice')
  );
  if (brandVoiceH2) {
    // Add brand name to the heading
    const currentText = brandVoiceH2.textContent || 'Brand Voice';
    if (brandName && !currentText.includes(brandName)) {
      brandVoiceH2.textContent = `${brandName} Brand Voice`;
    }
    
    // Add divider before Brand Voice section
    const divider = document.createElement('hr');
    divider.style.border = 'none';
    divider.style.borderTop = '1px solid #e2e8f0';
    divider.style.margin = '2rem 0';
    brandVoiceH2.parentNode?.insertBefore(divider, brandVoiceH2);
    
    // Add numbering to brand voice traits
    let currentElement = brandVoiceH2.nextElementSibling;
    let traitNumber = 1;
    
    while (currentElement) {
      if (currentElement.tagName.toLowerCase() === 'h2') {
        // Stop if we hit another major section
        break;
      }
      if (currentElement.tagName.toLowerCase() === 'h3') {
        // Add numbering to trait titles
        const traitTitle = currentElement.textContent;
        if (traitTitle && !traitTitle.match(/^\d+\./)) {
          currentElement.textContent = `${traitNumber}. ${traitTitle}`;
          traitNumber++;
        }
      }
      currentElement = currentElement.nextElementSibling;
    }
  }
  
  return tempDiv.innerHTML;
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
    const savedBrandDetails = localStorage.getItem("brandDetails")
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
      
      // Get session token for abandoned cart tracking
      const sessionToken = localStorage.getItem("emailCaptureToken");
      console.log('[Payment] Using session token for abandoned cart tracking:', sessionToken);
      
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          guideType,
          sessionToken // Pass our early session token to bridge with Stripe
        })
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to create checkout session';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
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
        <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
          <Logo size="md" linkToHome={true} />
        </div>
      </header>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[600px] text-sm sm:text-base">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-base sm:text-xl">Complete your purchase</DialogTitle>
            <DialogDescription className="text-xs sm:text-base">
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

                {/* Add guarantee */}
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg p-3">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="font-medium">30-day money-back guarantee</span>
                </div>

                <Button
                  onClick={() => handlePayment('core')}
                  disabled={isProcessingPayment}
                  className="w-full text-base sm:text-lg py-4 sm:py-6"
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
                  <h3 className="text-lg sm:text-2xl font-bold">Complete Style Guide</h3>
                  <div className="mt-1 text-xl sm:text-3xl font-bold">$149</div>
                </div>

                <div className="rounded-lg bg-purple-50 p-4 space-y-2">
                  <h4 className="font-semibold text-purple-700 text-base sm:text-lg">99+ Comprehensive Rules</h4>
                  <p className="text-xs sm:text-sm text-purple-600">Ideal for established brands and larger teams</p>
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

                {/* Add guarantee */}
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg p-3">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="font-medium">30-day money-back guarantee</span>
                </div>

                <Button
                  onClick={() => handlePayment('complete')}
                  disabled={isProcessingPayment}
                  className="w-full text-base sm:text-lg py-4 sm:py-6"
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
              className="w-full text-base sm:text-lg py-4 sm:py-6"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className={`flex-1 py-8 transition-opacity duration-500 ease-in-out ${fadeIn ? "opacity-100" : "opacity-0"}`}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 px-8">
          <Link
            href="/brand-details"
              className="inline-flex items-center gap-2 text-sm sm:text-base font-medium px-4 py-2 rounded-md border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" /> Back to details
          </Link>
        </div>

          <div className="bg-white rounded-2xl border shadow-lg overflow-hidden">
            <StyleGuideHeader 
              brandName={brandDetails?.name || 'Your Brand'} 
              guideType="core"
            />
            <div className="p-8 bg-white">
              <div className="max-w-2xl mx-auto space-y-12">
                <div className="prose prose-slate dark:prose-invert max-w-none style-guide-content prose-sm sm:prose-base">
                <ContentWithFadeout>
                  <div dangerouslySetInnerHTML={{ __html: processPreviewContent(previewContent, brandDetails?.name) }} />
                </ContentWithFadeout>

                {/* Add paywall banner */}
                  <div className="my-6 mb-20 p-6 sm:p-8 bg-blue-50 border border-blue-100 rounded-lg shadow-sm text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                        Unlock Your Style Guide
                  </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                        Get access to all writing rules, detailed examples, and professional formats to create a consistent brand voice.
                  </p>
                  

                  
                  <Button
                    onClick={() => setPaymentDialogOpen(true)}
                        className="w-full sm:w-auto text-base sm:text-lg py-3 sm:py-4 px-6 sm:px-8 bg-gray-900 hover:bg-gray-800 text-white shadow-sm hover:shadow-md transition-all duration-200"
                  >
                        <CreditCard className="h-4 w-4 mr-2" /> 
                        Unlock Style Guide
                  </Button>
                      <p className="text-xs text-green-600 mt-4">
                        ✓ Instant access ✓ 30-day guarantee ✓ No subscriptions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

