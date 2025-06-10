"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, FileText, Loader2, Check, X, ChevronDown } from "lucide-react"
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
import { generateFile, FileFormat } from "@/lib/file-generator"
import Header from "@/components/Header"
import { StyleGuideHeader } from "@/components/StyleGuideHeader"

export default function FullAccessPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [showNotionInstructions, setShowNotionInstructions] = useState(false)
  const [generatedStyleGuide, setGeneratedStyleGuide] = useState<string | null>(null)
  const [brandDetails, setBrandDetails] = useState<any>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<string | null>(null)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)
  const [guideType, setGuideType] = useState<string>("core")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load brand details, style guide, and guide type from localStorage
    const savedBrandDetails = localStorage.getItem("brandDetails")
    const savedGuideType = localStorage.getItem("styleGuidePlan")
    
    if (!savedBrandDetails) {
      console.error("[Full Access] No brand details found in localStorage")
      toast({
        title: "Session expired",
        description: "Please fill in your brand details again.",
        variant: "destructive",
      })
      router.push("/brand-details?paymentComplete=true")
      return
    }
    
    if (savedBrandDetails) {
      setBrandDetails(JSON.parse(savedBrandDetails))
    }
    if (savedGuideType) {
      setGuideType(savedGuideType)
    }

    const loadFullAccessGuide = async () => {
      if (!savedBrandDetails) return
      try {
        const parsedBrandDetails = JSON.parse(savedBrandDetails)
        const response = await fetch('/api/generate-styleguide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandDetails: parsedBrandDetails,
            plan: savedGuideType === 'complete' ? 'complete' : 'core',
          }),
        })
        const data = await response.json()
        if (data.success) {
          setGeneratedStyleGuide(data.styleGuide)
        } else {
          throw new Error(data.error || 'Failed to generate style guide')
        }
      } catch (error) {
        console.error("Error generating full access guide:", error)
        toast({
          title: "Generation failed", 
          description: "Could not generate your style guide. Please try again.",
          variant: "destructive",
        })
        router.push("/brand-details?paymentComplete=true")
      }
      setIsLoading(false)
    }
    loadFullAccessGuide()
    // Trigger fade-in animation
    const timer = setTimeout(() => {
      setFadeIn(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [router])

  const handleCopy = () => {
    setCopied(true)
    const shareableLink = window.location.href

    navigator.clipboard
      .writeText(shareableLink)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "The style guide link has been copied to your clipboard.",
        })
      })
      .catch((err) => {
        console.error("Could not copy text: ", err)
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard. Please try again.",
          variant: "destructive",
        })
      })
      .finally(() => {
        setTimeout(() => setCopied(false), 2000)
      })
  }

  const handleDownload = async (format: string) => {
    if (!generatedStyleGuide || !brandDetails) return

    setIsDownloading(true)
    setDownloadFormat(format)

    try {
      // Use processed content for downloads to avoid double headers
      const processedContent = processFullAccessContent(generatedStyleGuide, brandDetails.name)
      
      const file = await generateFile(format as FileFormat, processedContent, brandDetails.name)
      const url = window.URL.createObjectURL(file)
      const a = document.createElement("a")
      a.href = url
      a.download = `${brandDetails.name.replace(/\s+/g, '-').toLowerCase()}-style-guide.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download started",
        description: `Your style guide is downloading in ${format.toUpperCase()} format.`,
      })
    } catch (error) {
      console.error("Error generating file:", error)
      toast({
        title: "Download failed",
        description: "Could not generate the file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
      setDownloadFormat(null)
      setShowDownloadOptions(false)
    }
  }

  // Get guide content based on plan type
  const getGuideContent = () => {
    if (!generatedStyleGuide) return null
    
    // Always return full content - the template itself handles the content limits
    return generatedStyleGuide
  }

  const guideContent = getGuideContent()

  const exportPDF = async () => {
    const element = document.getElementById('pdf-export-content')
    if (!element) return
    // @ts-ignore
    const html2pdf = (await import('html2pdf.js')).default
    const opt = {
      margin: 0.5,
      filename: `${brandDetails?.name?.replace(/\s+/g, '-').toLowerCase() || 'style'}-guide.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  // Process content to remove duplicate headings that conflict with our header
  const processFullAccessContent = (content: string, brandName: string = "") => {
    if (!content) return content;
    
    // Remove the first h1 heading if it contains the brand name
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
      
      // Add divider after the callout
      const dividerAfterCallout = document.createElement('hr');
      dividerAfterCallout.style.border = 'none';
      dividerAfterCallout.style.borderTop = '1px solid #e2e8f0';
      dividerAfterCallout.style.margin = '2rem 0';
      calloutDiv.parentNode?.insertBefore(dividerAfterCallout, calloutDiv.nextSibling);
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Loading your style guide...</p>
      </div>
    )
  }

  if (!guideContent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Loading style guide...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header 
        containerClass="max-w-5xl mx-auto px-8 flex h-16 items-center justify-between"
        rightContent={
            <Button
              onClick={() => setShowDownloadOptions(true)}
              disabled={isDownloading}
              className="gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
              <ChevronDown className="h-4 w-4" />
              )}
              Download
            </Button>
        }
      />

      {/* Notion Instructions Dialog */}
      <Dialog open={showNotionInstructions} onOpenChange={setShowNotionInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import to Notion</DialogTitle>
            <DialogDescription>Follow these steps to import your style guide into Notion</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <ol className="list-decimal ml-5 space-y-2">
              <li>Download the HTML file</li>
              <li>In Notion, click "Import" from the sidebar</li>
              <li>Select "HTML" as the format</li>
              <li>Choose the downloaded file</li>
              <li>Click "Import"</li>
            </ol>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNotionInstructions(false)} className="w-full">Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 px-8">
            <Link
              href="/brand-details"
              className="inline-flex items-center gap-2 text-sm sm:text-base font-medium px-4 py-2 rounded-md border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" /> Back to details
            </Link>
            
            {/* Add refund option */}
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <span>✓ 30-day money-back guarantee</span>
              <span>•</span>
              <a
                href={`mailto:support@aistyleguide.com?subject=Refund%20Request%20-%20Style%20Guide%20Purchase&body=Hi%20AIStyleGuide%20Support%20Team,%0A%0AI%20would%20like%20to%20request%20a%20refund%20for%20my%20style%20guide%20purchase.%0A%0APurchase%20Details:%0A- Brand Name: ${brandDetails?.name || 'Not available'}%0A- Guide Type: ${guideType}%0A- Purchase Date: ${new Date().toLocaleDateString()}%0A%0AReason for refund (optional): %0A%0AThanks,%0A[Your%20Name]`}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Request refund
              </a>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border shadow-lg overflow-hidden">
            <div id="pdf-export-content">
              <StyleGuideHeader 
                brandName={brandDetails?.name || 'Your Brand'} 
                guideType={guideType as 'core' | 'complete'} 
              />
              <div className="p-8 bg-white">
                <div className="max-w-2xl mx-auto space-y-12">
                  <div className="prose prose-slate dark:prose-invert max-w-none style-guide-content prose-sm sm:prose-base">
                    <div dangerouslySetInnerHTML={{ __html: processFullAccessContent(guideContent, brandDetails?.name) }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Download Options Dialog */}
      <Dialog open={showDownloadOptions} onOpenChange={setShowDownloadOptions}>
        <DialogContent className="sm:max-w-[480px] bg-white border-gray-200">
          <DialogHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Download Style Guide
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Choose your preferred format
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 py-4">
            <Button
              onClick={exportPDF}
              disabled={isDownloading}
              className="w-full justify-start gap-3 h-14 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-none"
            >
              {downloadFormat === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <FileText className="h-4 w-4 text-gray-600" />
              )}
              <div className="text-left">
                <div className="font-medium text-gray-900">PDF</div>
                <div className="text-xs text-gray-500">Perfect for sharing</div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleDownload("docx")}
              disabled={isDownloading}
              className="w-full justify-start gap-3 h-14 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-none"
            >
              {downloadFormat === "docx" ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <FileText className="h-4 w-4 text-gray-600" />
              )}
              <div className="text-left">
                <div className="font-medium text-gray-900">Word</div>
                <div className="text-xs text-gray-500">Opens directly in Word</div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleDownload("html")}
              disabled={isDownloading}
              className="w-full justify-start gap-3 h-14 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-none"
            >
              {downloadFormat === "html" ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <FileText className="h-4 w-4 text-gray-600" />
              )}
              <div className="text-left">
                <div className="font-medium text-gray-900">HTML</div>
                <div className="text-xs text-gray-500">Ready to publish online</div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleDownload("md")}
              disabled={isDownloading}
              className="w-full justify-start gap-3 h-14 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-none"
            >
              {downloadFormat === "md" ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <FileText className="h-4 w-4 text-gray-600" />
              )}
              <div className="text-left">
                <div className="font-medium text-gray-900">Markdown</div>
                <div className="text-xs text-gray-500">Perfect for AI tools</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}