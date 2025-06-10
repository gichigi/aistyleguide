"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  CheckCircle,
  ArrowRight,
  FileDown,
  PenTool,
  FileCode,
  Brain,
  Globe,
  Loader2,
  AlertTriangle,
  Users,
  Rocket,
  Briefcase,
  PhoneCall,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import dynamic from "next/dynamic"
import BrandBanner from "@/components/BrandBanner"
import Logo from "@/components/Logo"
import Header from "@/components/Header"

// Default brand details
const defaultBrandDetails = {
  name: "AIStyleGuide",
  description: "A web app that generates brand voice and content style guides",
  audience: "marketing professionals aged 25-45 who are interested in branding, content creation, and efficiency",
  tone: "friendly",
}

// Feature flag for Nike demo CTA
const SHOW_NIKE_DEMO_CTA = false;

export default function LandingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isExtracting, setIsExtracting] = useState(false)
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  // Lazy load non-critical sections
  const TestimonialsSection = dynamic(() => import("../components/testimonials-section"), {
    ssr: false,
    loading: () => <div className="w-full py-12 md:py-20 lg:py-24 bg-muted"></div>,
  })

  const CompanyLogosSection = dynamic(() => import("../components/company-logos-section"), {
    ssr: false,
    loading: () => <div className="w-full py-6 bg-muted"></div>,
  })

  // URL validation function
  const isValidUrl = (urlString: string): boolean => {
    try {
      // If URL is empty, it's valid (user can enter details manually)
      if (!urlString.trim()) return true

      // Add https:// if missing
      const urlToCheck = urlString.match(/^https?:\/\//) ? urlString : `https://${urlString}`

      // Try to create a URL object
      new URL(urlToCheck)

      // Additional validation: must have a domain with at least one dot
      return urlToCheck.includes(".") && urlToCheck.match(/^https?:\/\/[^.]+\..+/) !== null
    } catch (e) {
      return false
    }
  }

  const handleExtraction = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Reset states at the start
    setIsSuccess(false)
    setIsExtracting(false)

    if (!url.trim()) {
      // If no URL, just navigate to brand details
      router.push("/brand-details")
      return
    }

    // Validate URL
    if (!isValidUrl(url)) {
      setError("Please enter a valid URL (e.g., example.com)")
      return
    }

    // Show loading state
    setIsExtracting(true)

    try {
      // Format the URL if needed (add https:// if missing)
      let formattedUrl = url.trim()
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = "https://" + formattedUrl
      }

      // Call our API endpoint to extract website info
      const response = await fetch("/api/extract-website", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: formattedUrl }),
      })

      const data = await response.json()

      if (data.success) {
        // Store the extracted brand details in localStorage with correct format
        localStorage.setItem("brandDetails", JSON.stringify({
          brandDetailsText: data.brandDetailsText,
          tone: "friendly" // Default tone
        }))

        // Show success state briefly before redirecting
        setIsSuccess(true)
        setIsExtracting(false)

        // Navigate to brand details page after a short delay for transition
        setTimeout(() => {
          router.push("/brand-details?fromExtraction=true")
        }, 800)
      } else {
        // Show error toast but still navigate
        toast({
          title: "Website analysis issue",
          description: data.message,
          variant: "destructive",
        })

        // Reset states
        setIsExtracting(false)
        setIsSuccess(false)

        // Navigate to brand details page
        router.push("/brand-details")
      }
    } catch (error) {
      console.error("Error extracting website info:", error)
      setError("There was a problem analyzing this website. Please try again or enter details manually.")

      toast({
        title: "Error",
        description: "There was a problem analyzing this website. Please try again or enter details manually.",
        variant: "destructive",
      })

      // Reset states
      setIsExtracting(false)
      setIsSuccess(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <style jsx global>{logoStyles}</style>
      <Header showNavigation={true} showGetStarted={true} />
      <main className="flex-1">
        {/* Hero Section - Redesigned with URL input */}
        <section id="hero" className="w-full py-12 md:py-20 lg:py-24 bg-gradient-to-b from-background to-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium mb-4 bg-gray-100 text-gray-800 border-gray-200">
                AI Brand Voice & Style Guide
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-4">
                Create a style guide in minutes, not months
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mb-8 hero-lead">
                Generate a comprehensive brand voice and style guide tailored to your brand in a few clicks.
              </p>

              <form onSubmit={handleExtraction} className="w-full max-w-2xl">
                {/* Minimal input + button layout, no color */}
                <div className="relative w-full max-w-2xl mx-auto mt-4 mb-6 p-1 rounded-full bg-white border border-gray-200 shadow-sm">
                  <div className="flex items-center w-full bg-white rounded-full overflow-hidden">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Globe className="h-6 w-6 text-gray-400 transition-colors duration-200" />
                      </div>
                      <Input
                        type="text"
                        placeholder="e.g. nike.com"
                        className={`pl-12 pr-4 sm:pr-40 py-6 text-lg font-sans font-medium bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-gray-400 placeholder:font-medium placeholder:text-base w-full transition-all duration-200 ${error ? "ring-2 ring-red-500" : ""} ${isSuccess ? "ring-2 ring-green-500 bg-green-50" : ""}`}
                        value={url}
                        onChange={(e) => {
                          setUrl(e.target.value)
                          if (error) setError("")
                        }}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        inputMode="url"
                        disabled={isExtracting || isSuccess}
                        aria-label="Website URL"
                        style={{ boxShadow: 'none' }}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className={`h-10 sm:h-12 px-6 sm:px-8 rounded-full bg-gray-100 text-gray-800 font-medium text-base sm:text-lg shadow-none hover:bg-gray-200 focus:bg-gray-200 transition-all duration-200 z-10 ${isSuccess ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
                      disabled={isExtracting || isSuccess}
                      style={{ borderTopLeftRadius: 9999, borderBottomLeftRadius: 9999 }}
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          Checking
                        </>
                      ) : isSuccess ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          Done!
                        </>
                      ) : (
                        <>
                          <span className="text-xs sm:text-sm md:text-base">Analyze</span> <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                  {/* Manual entry link at bottom right outside the container */}
                  <div className="absolute right-6 -bottom-7">
                    <Link href="/brand-details" className="text-gray-400 underline font-medium text-sm whitespace-nowrap" style={{ textTransform: 'lowercase' }}>
                      or add brand details manually
                    </Link>
                  </div>
                </div>
                {/* Secondary CTA: Book a Call */}
                {SHOW_NIKE_DEMO_CTA && (
                  <Button
                    asChild
                    variant="secondary"
                    size="lg"
                    className="w-full py-6 text-lg mt-10"
                  >
                    <Link 
                      href="https://calendly.com/l-gichigi/customer-chat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <PhoneCall className="h-5 w-5" />
                      Book a Call
                    </Link>
                  </Button>
                )}
              </form>
            </div>
          </div>
        </section>

        <BrandBanner />
        
        {/* What You Get - MOVED TO 2ND POSITION AND BACKGROUND CHANGED */}
        <section id="features" className="w-full py-12 md:py-20 lg:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Your brand voice toolkit
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to create consistent, professional communication
                </p>
              </div>
            </div>
            {/* Mobile-optimized grid */}
            <div className="mx-auto max-w-5xl items-center gap-8 py-10 grid grid-cols-1 lg:grid-cols-2 lg:gap-16">
              {/* Feature list with improved mobile spacing */}
              <div className="grid gap-8 md:gap-6">
                {/* Each feature as a card on mobile for better separation */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm md:shadow-none md:bg-transparent md:p-0">
                  <div className="flex-shrink-0">
                    <FileText className="h-9 w-9 md:h-8 md:w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">99+ enterprise-grade content rules</h3>
                    <p className="text-muted-foreground">
                      Used by Apple, Spotify, BBC and other leading brands
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm md:shadow-none md:bg-transparent md:p-0">
                  <div className="flex-shrink-0">
                    <PenTool className="h-9 w-9 md:h-8 md:w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">A clear brand voice framework</h3>
                    <p className="text-muted-foreground">
                      Define your brand persona with unique brand traits
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm md:shadow-none md:bg-transparent md:p-0">
                  <div className="flex-shrink-0">
                    <FileDown className="h-9 w-9 md:h-8 md:w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Multiple export formats</h3>
                    <p className="text-muted-foreground">PDF, Word, HTML, and Markdown for any workflow</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm md:shadow-none md:bg-transparent md:p-0">
                  <div className="flex-shrink-0">
                    <FileCode className="h-9 w-9 md:h-8 md:w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Brand voice examples</h3>
                    <p className="text-muted-foreground">Real-world applications across different content types</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-white shadow-sm md:shadow-none md:bg-transparent md:p-0">
                  <div className="flex-shrink-0">
                    <Brain className="h-9 w-9 md:h-8 md:w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Built-in tone selector</h3>
                    <p className="text-muted-foreground">Adapt your voice for any situation with multiple tones</p>
                  </div>
                </div>
              </div>
              {/* Tab component with better mobile handling */}
              <div className="relative overflow-hidden rounded-xl border bg-white p-4 shadow-md mt-6 lg:mt-0">
                <Tabs defaultValue="formal" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="formal">Formal</TabsTrigger>
                    <TabsTrigger value="friendly">Friendly</TabsTrigger>
                    <TabsTrigger value="funny">Funny</TabsTrigger>
                  </TabsList>
                  <TabsContent value="formal" className="p-4 space-y-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-semibold">Example: Formal Brand Voice</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        "Our comprehensive solution provides organizations with the tools necessary to optimize their
                        content strategy."
                      </p>
                      <p className="text-muted-foreground">
                        "We prioritize precision and clarity in all communications to ensure maximum effectiveness."
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="friendly" className="p-4 space-y-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-semibold">Example: Friendly Brand Voice</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        "Hey there! Our tool helps you nail your content strategy without the headache."
                      </p>
                      <p className="text-muted-foreground">
                        "We're all about keeping things simple and clear, so you can get back to what you do best."
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="funny" className="p-4 space-y-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h4 className="font-semibold">Example: Funny Brand Voice</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        "Let's face it, your content strategy is about as organized as a toddler's toy box. We can fix
                        that."
                      </p>
                      <p className="text-muted-foreground">
                        "Our style guide is like GPS for your writing—except it won't lead you into a lake like that one
                        time."
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - BACKGROUND CHANGED TO WHITE FOR ALTERNATION */}
        <section id="how-it-works" className="w-full py-12 md:py-20 lg:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Input to impact in 3 steps
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Generate a comprehensive style guide with just a few clicks
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-8 md:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-bold">Answer a few questions</h3>
                <p className="text-center text-muted-foreground">
                  Tell us about your brand or let our AI extract details from your website
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-bold">Get personalized rules</h3>
                <p className="text-center text-muted-foreground">
                  Receive a tailored tone of voice + 99+ writing rules for your brand
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-bold">Export and share</h3>
                <p className="text-center text-muted-foreground">
                  Download in multiple formats: PDF, Word, HTML, or Markdown for any workflow
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <TestimonialsSection />

        {/* Example Output Preview - Redesigned with annotations - BACKGROUND CHANGED TO WHITE FOR ALTERNATION */}
        <section id="example" className="w-full py-6 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Sample style guide
                </h2>
                <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl mb-4">
                  See an example of what your style guide will look like
                </p>
              </div>
            </div>

            {/* Style Guide Document Preview with Modern Look */}
            <div className="mx-auto max-w-4xl py-10 relative">
              <div className="bg-white rounded-2xl border shadow-lg overflow-hidden pb-0">
                {/* Document Header */}
                <div className="p-8 border-b bg-gray-50">
                  <div className="max-w-2xl mx-auto">
                    <div className="text-base text-gray-500 mb-2 tracking-wide font-semibold">
                      A Complete Content Style Guide
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gray-900">Nike Brand Voice & Content Style Guide</h1>
                    <p className="text-gray-500 text-base">Created on {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                {/* Document Content */}
                <div className="p-8 bg-white">
                  <div className="max-w-2xl mx-auto space-y-12">
                    {/* About Section */}
                    <section>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900">About Nike</h2>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        Nike empowers every athlete. This guide keeps our voice clear and bold.
                      </p>
                      {/* About Annotation as Info Card */}
                      <div className="mt-4 flex items-center gap-3">
                        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-blue-700 text-sm font-medium">
                          <span className="font-semibold">Company Overview:</span> Your brand's mission in one place.
                        </div>
                      </div>
                    </section>

                    {/* Brand Voice Section */}
                    <section>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900">Brand Voice</h2>
                      <p className="text-gray-700 mb-4">
                        Our voice is bold, inspiring, and direct.
                      </p>
                      <ul className="space-y-6">
                        <li className="bg-gray-100 p-6 rounded-xl border-l-4 border-indigo-600 shadow-sm flex flex-col gap-3">
                          <h3 className="font-semibold mb-2 text-gray-900 text-lg">Confident but approachable</h3>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2 items-center">
                              <span className="text-blue-500 font-normal">Do:</span>
                              <span className="text-gray-800 font-normal text-base">"We help every athlete unleash their potential."</span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <span className="text-rose-600 font-normal">Don't:</span>
                              <span className="text-gray-800 font-normal text-base">"We're the world's #1—just trust us."</span>
                            </div>
                          </div>
                        </li>
                      </ul>
                      {/* Brand Voice Annotation as Info Card */}
                      <div className="mt-4 flex items-center gap-3">
                        <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-2 text-indigo-700 text-sm font-medium">
                          <span className="font-semibold">Voice Definition:</span> See how your brand's personality is described.
                        </div>
                      </div>
                    </section>

                    {/* Grammar & Mechanics Section */}
                    <section>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900">Grammar & Mechanics</h2>
                      <ul className="space-y-6">
                        <li className="bg-gray-100 p-6 rounded-xl border-l-4 border-blue-500 shadow-sm flex flex-col gap-3">
                          <h3 className="font-semibold mb-2 text-gray-900">Use American English</h3>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2 items-center">
                              <span className="text-blue-500 font-normal">Do:</span>
                              <span className="text-gray-800 font-normal text-base">"Color", "Optimize"</span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <span className="text-rose-600 font-normal">Don't:</span>
                              <span className="text-gray-800 font-normal text-base">"Colour", "Optimise"</span>
                            </div>
                          </div>
                        </li>
                      </ul>
                      <div className="text-sm text-gray-500 mt-2">And 99+ more rules for clarity and consistency.</div>
                      {/* Grammar Annotation as Info Card */}
                      <div className="mt-4 flex items-center gap-3">
                        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-blue-700 text-sm font-medium">
                          <span className="font-semibold">Writing Rules:</span> 99+ rules for clear, consistent content.
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button below card, center aligned in preview section
            <div className="flex justify-center mt-4 mb-4">
               <Button onClick={() => router.push('/start')} className="gap-2 px-8 py-4 rounded-full font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                Create your own style guide <ArrowRight className="h-5 w-5" />
              </Button>
            </div> */}
          </div>
        </section>

        {/* Pricing Section - BACKGROUND CHANGED TO MUTED FOR ALTERNATION */}
        <section id="pricing" className="w-full py-12 md:py-20 lg:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Pay once, use forever</h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  No subscriptions or hidden fees
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-8 md:grid-cols-3">
              <Card className="relative overflow-hidden border-2 border-blue-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-background"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <h3 className="text-2xl font-bold text-blue-700">Core Style Guide</h3>
                    <div className="space-y-1">
                      <p className="text-5xl font-bold text-blue-700">$99</p>
                      <p className="text-sm text-muted-foreground">One-time payment</p>
                    </div>
                    <ul className="space-y-2 text-left">
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                        <span>Brand voice definition</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                        <span>25 essential writing rules</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                        <span>Tone guidelines</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                        <span>Do's and don'ts</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                        <span>Multiple export formats</span>
                      </li>
                    </ul>
                    <Button size="lg" className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full px-8 py-3 shadow-md" onClick={() => router.push("/brand-details")}>Get Core Guide</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-4 border-indigo-600 shadow-lg scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-background"></div>
                <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg shadow">Most Popular</div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <h3 className="text-2xl font-bold text-indigo-700">Complete Style Guide</h3>
                    <div className="space-y-1">
                      <p className="text-5xl font-bold text-indigo-700">$149</p>
                      <p className="text-sm text-muted-foreground">One-time payment</p>
                    </div>
                    <ul className="space-y-2 text-left">
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-indigo-600" />
                        <span>Everything in Core Guide</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-indigo-600" />
                        <span>99+ modern writing rules</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-indigo-600" />
                        <span>Used by Apple, Spotify, BBC</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-indigo-600" />
                        <span>Formatting standards</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-indigo-600" />
                        <span>Example corrections</span>
                      </li>
                    </ul>
                    <Button size="lg" className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full px-8 py-3 shadow-md" onClick={() => router.push("/brand-details")}>Get Complete Guide</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 border-black">
                <div className="absolute inset-0 bg-gradient-to-br from-black to-gray-900"></div>
                <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 text-xs font-medium rounded-bl-lg shadow">Enterprise</div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <h3 className="text-2xl font-bold text-white">Custom Enterprise</h3>
                    <div className="space-y-1">
                      <p className="text-5xl font-bold text-white">Contact</p>
                      <p className="text-sm text-gray-200">Custom pricing</p>
                    </div>
                    <ul className="space-y-2 text-left">
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-white" />
                        <span className="text-white">Everything in Complete Guide</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-white" />
                        <span className="text-white">Custom onboarding</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-white" />
                        <span className="text-white">Dedicated account manager</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-white" />
                        <span className="text-white">Team training sessions</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-white" />
                        <span className="text-white">Custom integrations</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-white" />
                        <span className="text-white">Priority support</span>
                      </li>
                    </ul>
                    <Button size="lg" className="mt-2 bg-white hover:bg-gray-200 text-black font-bold rounded-full px-8 py-3 shadow-md" variant="outline" asChild>
                      <Link href="mailto:enterprise@styleguideai.com">Contact Sales</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Who It's For - Redesigned and moved below pricing */}
        <section className="w-full py-12 md:py-16 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-2 text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Who uses our style guides</h2>
              <p className="text-base text-gray-500">For teams and creators who care about consistency.</p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10">
              <div className="flex flex-col items-center p-6 rounded-xl border bg-gradient-to-b from-white to-gray-50 shadow-sm hover:shadow-md transition-all">
                <PenTool className="h-10 w-10 text-blue-500 mb-2" />
                <h3 className="text-lg font-bold">Copywriters</h3>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl border bg-gradient-to-b from-white to-gray-50 shadow-sm hover:shadow-md transition-all">
                <Users className="h-10 w-10 text-indigo-600 mb-2" />
                <h3 className="text-lg font-bold">Marketing</h3>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl border bg-gradient-to-b from-white to-gray-50 shadow-sm hover:shadow-md transition-all">
                <Rocket className="h-10 w-10 text-green-600 mb-2" />
                <h3 className="text-lg font-bold">Founders</h3>
              </div>
              <div className="flex flex-col items-center p-6 rounded-xl border bg-gradient-to-b from-white to-gray-50 shadow-sm hover:shadow-md transition-all">
                <Briefcase className="h-10 w-10 text-gray-700 mb-2" />
                <h3 className="text-lg font-bold">Agencies</h3>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ - BACKGROUND CHANGED TO MUTED FOR ALTERNATION */}
        <section id="faq" className="w-full py-12 md:py-20 lg:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Got questions?</h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We've got answers
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-3xl divide-y py-8">
              {[
                {
                  q: "What if I don't have a brand yet?",
                  a: "Our tool helps you define your brand voice from scratch. Just answer a few questions about your audience and goals.",
                },
                {
                  q: "How long does it take?",
                  a: "Most style guides are generated in under 2 minutes. You can review, download in multiple formats, and share with your team.",
                },
                {
                  q: "What formats can I download?",
                  a: "Your style guide is available in PDF, Word, HTML, and Markdown formats for easy sharing and integration with any workflow.",
                },
                {
                  q: "What's included in the style guide?",
                  a: "You'll get a brand voice definition, up to 99+ writing rules, tone guidelines, and practical examples tailored to your brand.",
                },
                {
                  q: "Can I edit my style guide?",
                  a: "Absolutely. Once generated, you can download Word, HTML, or Markdown, then edit however you like before saving or sharing.",
                },
                {
                  q: "Is this better than hiring a copywriter?",
                  a: "We deliver 90% of what most brands need in minutes instead of weeks, at a fraction of the cost of hiring a professional writer.",
                },
                {
                  q: "Can I share with my team?",
                  a: "Yes! Share your style guide with your entire team. You receive a permanent access link plus downloadable files.",
                },
                {
                  q: "How do I contact support?",
                  a: <span>Email us at <a href="mailto:support@aistyleguide.com?subject=Support%20Request&body=Hello%20AIStyleGuide%20Support%20Team,%0A%0AI%20need%20help%20with:%0A%0A[Please%20describe%20your%20issue%20here]%0A%0AThanks,%0A[Your%20Name]" className="text-primary hover:underline">support@aistyleguide.com</a> for any questions. We typically respond within 24 hours on business days.</span>,
                },
              ].map((item, i) => (
                <div key={i} className="py-6">
                  <h3 className="text-lg font-semibold">{item.q}</h3>
                  <p className="mt-2 text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full py-12 md:py-20 lg:py-24 bg-background text-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Build brand consistency in minutes
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                No more guesswork. Just consistent content at every single touchpoint.
                </p>
              </div>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="gap-1"
                  onClick={() => {
                    // Scroll to hero section
                    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  Create your style guide <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 md:py-12 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="mb-2">
                <div className="logo-light">
                  <Logo size="lg" linkToHome={false} />
                </div>
              </div>
              <p className="text-sm text-primary-foreground/80">
                Create professional brand voice and style guides in minutes, not months.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Pages</h3>
              <ul className="space-y-2">
                <li><Link href="#how-it-works" className="text-sm hover:underline">How It Works</Link></li>
                <li><Link href="#features" className="text-sm hover:underline">Features</Link></li>
                <li><Link href="#pricing" className="text-sm hover:underline">Pricing</Link></li>
                <li><Link href="#faq" className="text-sm hover:underline">FAQ</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Contact</h3>
              <ul className="space-y-2">
                <li><a href="mailto:support@aistyleguide.com" className="text-sm hover:underline">support@aistyleguide.com</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm hover:underline">Terms of Service</Link></li>
                <li><Link href="#" className="text-sm hover:underline">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-primary-foreground/80">
              © {new Date().getFullYear()} AIStyleGuide. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-primary-foreground hover:text-primary-foreground/80">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-primary-foreground hover:text-primary-foreground/80">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-primary-foreground hover:text-primary-foreground/80">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Custom styles for the footer logo
const logoStyles = `
  .logo-light span {
    color: white !important; 
  }
`



