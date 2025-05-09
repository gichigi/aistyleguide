"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { generateFile } from "@/lib/file-generator";
import { MarkdownComponents } from "@/lib/markdown-components";
import ReactMarkdown from "react-markdown";
import { FileFormat } from "@/lib/file-generator";

// Fix emoji headings so that emojis after heading markers
function fixEmojiHeadings(markdown: string): string {
  // Move leading emoji(s) to after heading marker(s) for headings
  // Example: '✍🏻 ## General tips' => '## ✍🏻 General tips'
  return markdown.replace(
    /^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)\s*(#+)/gmu,
    (_match, emoji, hashes) => {
      return `${hashes} ${emoji}`;
    }
  );
}

export default function FullAccessPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showNotionInstructions, setShowNotionInstructions] = useState(false);
  const [generatedStyleGuide, setGeneratedStyleGuide] = useState<string | null>(
    null
  );
  const [brandDetails, setBrandDetails] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<string | null>(null);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [guideType, setGuideType] = useState<string>("core");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check payment status
    const paymentStatus = localStorage.getItem("styleGuidePaymentStatus");
    if (paymentStatus !== "completed") {
      router.push("/preview");
      return;
    }

    // Load brand details, style guide, and guide type
    const savedBrandDetails = localStorage.getItem("brandDetails");
    const savedStyleGuide = localStorage.getItem("generatedStyleGuide");
    const savedGuideType = localStorage.getItem("styleGuidePlan");

    if (savedBrandDetails) {
      setBrandDetails(JSON.parse(savedBrandDetails));
    }

    if (savedStyleGuide) {
      console.log(
        "Style guide content preview:",
        savedStyleGuide.substring(0, 200) + "..."
      );
      setGeneratedStyleGuide(savedStyleGuide);
    } else {
      console.log("No style guide content found in localStorage");
      // If no style guide, redirect to brand details to generate it
      router.push("/brand-details?paymentComplete=true");
      return;
    }

    if (savedGuideType) {
      setGuideType(savedGuideType);
    }

    setIsLoading(false);

    // Trigger fade-in animation
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  const handleCopy = () => {
    setCopied(true);
    const shareableLink = window.location.href;

    navigator.clipboard
      .writeText(shareableLink)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description:
            "The style guide link has been copied to your clipboard.",
        });
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setTimeout(() => setCopied(false), 2000);
      });
  };

  const handleDownload = async (format: FileFormat) => {
    // [TODO] - Add brand details are not being properly saved to localStorage
    // if (!generatedStyleGuide || !brandDetails) return;
    if (!generatedStyleGuide) return;

    setIsDownloading(true);
    setDownloadFormat(format);

    try {
      // [TODO] - The whole branddetails object is not needed for the file generation
      // Just the brandname, given that this feature is broken. I will default the brandname "Your Brand"
      const file = await generateFile(
        format as FileFormat,
        generatedStyleGuide,
        "Your Brand"
      );
      const url = window.URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = `style-guide.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Your style guide is downloading in ${format.toUpperCase()} format.`,
      });
    } catch (error) {
      console.error("Error generating file:", error);
      toast({
        title: "Download failed",
        description: "Could not generate the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
      setDownloadFormat(null);
      setShowDownloadOptions(false);
    }
  };

  // Get guide content based on plan type
  const getGuideContent = () => {
    if (!generatedStyleGuide) return null;

    // Always return full content - the template itself handles the content limits
    return generatedStyleGuide;
  };

  const guideContent = getGuideContent();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Loading your style guide...</p>
      </div>
    );
  }

  if (!guideContent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Loading style guide...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 dark:border-gray-800">
        <div className="container px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 min-w-0 max-w-[180px] sm:max-w-none"
          >
            <FileText className="h-5 w-5 flex-shrink-0" />
            <span className="text-lg font-semibold truncate whitespace-nowrap">
              Style Guide AI
            </span>
          </Link>
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </header>

      {/* Notion Instructions Dialog */}
      <Dialog
        open={showNotionInstructions}
        onOpenChange={setShowNotionInstructions}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import to Notion</DialogTitle>
            <DialogDescription>
              Follow these steps to import your style guide into Notion
            </DialogDescription>
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
            <Button onClick={() => setShowNotionInstructions(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="flex-1 container py-8 max-w-5xl">
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden dark:bg-gray-950 dark:border-gray-800 relative">
          <div className="p-8">
            <div className="max-w-3xl mx-auto">
              <div
                className={`prose prose-slate dark:prose-invert max-w-none ${
                  fadeIn ? "opacity-100" : "opacity-0"
                } transition-opacity duration-500`}
              >
                <ReactMarkdown components={MarkdownComponents}>
                  {fixEmojiHeadings(guideContent)}
                </ReactMarkdown>
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
              onClick={() => handleDownload("pdf")}
              disabled={isDownloading}
              className="w-full justify-start gap-2"
            >
              {downloadFormat === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              PDF
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
              Word
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
              HTML
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
