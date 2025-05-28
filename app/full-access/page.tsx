"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, FileText, Loader2, Check, X, ArrowRight } from "lucide-react"
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
      const file = await generateFile(format as FileFormat, generatedStyleGuide, brandDetails.name)
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
    const element = document.getElementById('pdf-content')
    if (!element) return
    const html2pdf = (await import('html2pdf.js')).default
    const opt = {
      margin: 0.5,
      filename: 'style-guide.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

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
        rightContent={
          <>
            <div className="px-4 py-2 text-sm font-medium rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border border-green-200 dark:border-green-800">
              {guideType === "complete" ? "Complete Guide" : "Core Guide"}
            </div>
            <Button
              onClick={() => setShowDownloadOptions(true)}
              disabled={isDownloading}
              className="gap-2"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Download
            </Button>
          </>
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
      <main className="flex-1 container py-8 max-w-5xl">
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden dark:bg-gray-950 dark:border-gray-800 relative">
          <div className="p-8">
            <div className="max-w-3xl mx-auto space-y-12">
              <div id="pdf-content" className="prose prose-slate dark:prose-invert max-w-none style-guide-content">
                <div dangerouslySetInnerHTML={{ __html: guideContent }} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Download Options Dialog */}
      <Dialog open={showDownloadOptions} onOpenChange={setShowDownloadOptions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Style Guide</DialogTitle>
            <DialogDescription>Choose your preferred format</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              onClick={exportPDF}
              disabled={isDownloading}
              className="w-full justify-start gap-2"
            >
              {downloadFormat === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              PDF (to share)
            </Button>
            <Button
              onClick={() => handleDownload("docx")}
              disabled={isDownloading}
              className="w-full justify-start gap-2"
            >
              {downloadFormat === "docx" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Word HTML (opens in Word)
            </Button>
            <Button
              onClick={() => handleDownload("html")}
              disabled={isDownloading}
              className="w-full justify-start gap-2"
            >
              {downloadFormat === "html" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              HTML (to publish)
            </Button>
            <Button
              onClick={() => handleDownload("md")}
              disabled={isDownloading}
              className="w-full justify-start gap-2"
            >
              {downloadFormat === "md" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Markdown (to code with AI)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}