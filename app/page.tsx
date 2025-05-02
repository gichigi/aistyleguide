"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import { apiPost } from "@/lib/api-client";

// Default brand details
const defaultBrandDetails = {
  name: "Style Guide AI",
  description: "A web app that generates brand voice and content style guides",
  audience:
    "marketing professionals aged 25-45 who are interested in branding, content creation, and efficiency",
  tone: "friendly",
};

export default function LandingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isExtracting, setIsExtracting] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Lazy load non-critical sections
  const TestimonialsSection = dynamic(
    () => import("../components/testimonials-section"),
    {
      ssr: false,
      loading: () => (
        <div className="w-full py-12 md:py-20 lg:py-24 bg-muted"></div>
      ),
    }
  );

  const CompanyLogosSection = dynamic(
    () => import("../components/company-logos-section"),
    {
      ssr: false,
      loading: () => <div className="w-full py-6 bg-muted"></div>,
    }
  );

  // URL validation function
  const isValidUrl = (urlString: string): boolean => {
    try {
      // If URL is empty, it's valid (user can enter details manually)
      if (!urlString.trim()) return true;

      // Add https:// if missing
      const urlToCheck = urlString.match(/^https?:\/\//)
        ? urlString
        : `https://${urlString}`;

      // Try to create a URL object
      new URL(urlToCheck);

      // Additional validation: must have a domain with at least one dot
      return (
        urlToCheck.includes(".") &&
        urlToCheck.match(/^https?:\/\/[^.]+\..+/) !== null
      );
    } catch (e) {
      return false;
    }
  };

  const handleExtraction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Reset states at the start
    setIsSuccess(false);
    setIsExtracting(false);

    if (!url.trim()) {
      // If no URL, just navigate to brand details
      router.push("/brand-details");
      return;
    }

    // Validate URL
    if (!isValidUrl(url)) {
      setError("Please enter a valid URL (e.g., example.com)");
      return;
    }

    // Show loading state
    setIsExtracting(true);

    try {
      // Format the URL if needed (add https:// if missing)
      let formattedUrl = url.trim();
      if (
        !formattedUrl.startsWith("http://") &&
        !formattedUrl.startsWith("https://")
      ) {
        formattedUrl = "https://" + formattedUrl;
      }

      // Call our API endpoint to extract website info using apiPost
      const data = await apiPost<{
        success: boolean;
        message?: string;
        brandDetails: {
          targetAudience: string;
          [key: string]: any;
        };
      }>("/api/extract-website", { url: formattedUrl });

      if (data.success) {
        // Store the extracted brand details in session storage
        const brandDetails = {
          ...data.brandDetails,
          audience: data.brandDetails.targetAudience, // Map targetAudience to audience
        };

        sessionStorage.setItem("brandDetails", JSON.stringify(brandDetails));

        // Show success state briefly before redirecting
        setIsSuccess(true);
        setIsExtracting(false);

        router.push("/brand-details?fromExtraction=true");
      } else {
        // Show error toast but still navigate with fallback data
        toast({
          title: "Website analysis issue",
          description: data.message,
          variant: "destructive",
        });

        // Store fallback data with proper field mapping
        const fallbackDetails = {
          ...data.brandDetails,
          audience:
            data.brandDetails?.targetAudience || defaultBrandDetails.audience,
        };
        sessionStorage.setItem("brandDetails", JSON.stringify(fallbackDetails));

        // Reset states
        setIsExtracting(false);
        setIsSuccess(false);

        // Navigate to brand details page
        router.push("/brand-details?fromExtraction=default");
      }
    } catch (error) {
      console.error("Error extracting website info:", error);
      setError(
        "There was a problem analyzing this website. Please try again or enter details manually."
      );

      toast({
        title: "Error",
        description:
          "There was a problem analyzing this website. Please try again or enter details manually.",
        variant: "destructive",
      });

      // Reset states
      setIsExtracting(false);
      setIsSuccess(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-semibold">Style Guide AI</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link
              href="#how-it-works"
              className="text-sm font-medium hover:text-primary"
            >
              How It Works
            </Link>
            <Link
              href="#features"
              className="text-sm font-medium hover:text-primary"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium hover:text-primary"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium hover:text-primary"
            >
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="#example"
              className="hidden sm:inline-block text-sm font-medium hover:underline underline-offset-4"
            >
              See Example
            </Link>
            <Button asChild>
              <Link href="#hero">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {/* Hero Section - Redesigned with URL input */}
        <section
          id="hero"
          className="w-full py-12 md:py-20 lg:py-24 bg-gradient-to-b from-background to-muted"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium mb-4 bg-primary/10">
                AI Brand Voice & Style Guide
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-4">
                Create a style guide in minutes, not months
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mb-8">
                AI-generated voice and writing rules tailored to your brand —
                ready to export and share.
              </p>

              <form onSubmit={handleExtraction} className="w-full max-w-2xl">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {/* IMPORTANT: Keep this placeholder short for mobile screens */}
                    <Input
                      type="text"
                      placeholder="Enter website URL"
                      className={`pl-10 py-6 text-lg ${
                        error ? "border-red-500 focus-visible:ring-red-500" : ""
                      } 
                      ${
                        isSuccess
                          ? "border-green-500 focus-visible:ring-green-500 bg-green-50"
                          : ""
                      }`}
                      value={url}
                      onChange={(e) => {
                        console.log("e.target.value", e.target.value);
                        setUrl(e.target.value);
                        if (error) setError("");
                      }}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      inputMode="url"
                      disabled={isExtracting || isSuccess}
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-500 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className={`w-full py-6 text-lg transition-all duration-300 ${
                      isSuccess ? "bg-green-500 hover:bg-green-600" : ""
                    }`}
                    disabled={isExtracting || isSuccess}
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing your website...
                      </>
                    ) : isSuccess ? (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Success! Redirecting...
                      </>
                    ) : (
                      <>
                        Generate your style guide{" "}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-muted-foreground mt-2">
                    Or{" "}
                    <Link
                      href="/brand-details"
                      className="text-primary hover:underline"
                    >
                      enter your brand details manually
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Rest of the landing page remains the same */}
        {/* How It Works */}
        <section
          id="how-it-works"
          className="w-full py-12 md:py-20 lg:py-24 bg-background"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  From input to impact in 3 steps
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Generate a comprehensive style guide with just a few clicks
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-8 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-bold">Answer a few questions</h3>
                <p className="text-center text-muted-foreground">
                  Tell us about your brand or let our AI extract details from
                  your website
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-bold">Get personalized rules</h3>
                <p className="text-center text-muted-foreground">
                  Receive a tailored tone of voice + 99+ writing rules for your
                  brand
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-bold">Export and share</h3>
                <p className="text-center text-muted-foreground">
                  Download as PDF, Markdown, or integrate with your workflow
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What You Get */}
        <section
          id="features"
          className="w-full py-12 md:py-20 lg:py-24 bg-muted"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Your brand voice, documented
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to maintain consistent communication
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-8 lg:grid-cols-2 lg:gap-12">
              <div className="grid gap-6">
                <div className="flex items-start gap-4">
                  <PenTool className="h-8 w-8 text-primary" />
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">A clear tone of voice</h3>
                    <p className="text-muted-foreground">
                      Define your brand's personality with specific traits and
                      examples
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">
                      99+ modern content rules
                    </h3>
                    <p className="text-muted-foreground">
                      Professional guidelines used by Apple, Spotify, BBC and
                      other leading brands
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <FileCode className="h-8 w-8 text-primary" />
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">
                      Instant PDF + Notion-style output
                    </h3>
                    <p className="text-muted-foreground">
                      Multiple formats ready to share with your team or clients
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Brain className="h-8 w-8 text-primary" />
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Optional AI assistant</h3>
                    <p className="text-muted-foreground">
                      Get help applying your style guide to future content
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border bg-background p-2">
                <Tabs defaultValue="formal" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="formal">Formal Tone</TabsTrigger>
                    <TabsTrigger value="friendly">Friendly Tone</TabsTrigger>
                    <TabsTrigger value="funny">Funny Tone</TabsTrigger>
                  </TabsList>
                  <TabsContent value="formal" className="p-4 space-y-4">
                    <h4 className="font-semibold">
                      Example: Formal Brand Voice
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        "Our comprehensive solution provides organizations with
                        the tools necessary to optimize their content strategy."
                      </p>
                      <p className="text-muted-foreground">
                        "We prioritize precision and clarity in all
                        communications to ensure maximum effectiveness."
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="friendly" className="p-4 space-y-4">
                    <h4 className="font-semibold">
                      Example: Friendly Brand Voice
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        "Hey there! Our tool helps you nail your content
                        strategy without the headache."
                      </p>
                      <p className="text-muted-foreground">
                        "We're all about keeping things simple and clear, so you
                        can get back to what you do best."
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="funny" className="p-4 space-y-4">
                    <h4 className="font-semibold">
                      Example: Funny Brand Voice
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        "Let's face it, your content strategy is about as
                        organized as a toddler's toy box. We can fix that."
                      </p>
                      <p className="text-muted-foreground">
                        "Our style guide is like GPS for your writing—except it
                        won't lead you into a lake like that one time."
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="w-full py-12 md:py-20 lg:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Perfect for teams who need clarity in communication
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Perfect for teams and individuals who need clear writing
                  guidelines
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 sm:grid-cols-2 gap-6 py-8 md:grid-cols-4 lg:gap-12">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                <CheckCircle className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">Copywriters</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Create consistent content across projects
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                <CheckCircle className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">Marketing leads</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Align team messaging with brand values
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                <CheckCircle className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">Founders</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Establish your brand voice from day one
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                <CheckCircle className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">Agencies</h3>
                <p className="text-center text-sm text-muted-foreground">
                  Deliver professional guidelines to clients
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <TestimonialsSection />

        {/* Example Output Preview - Redesigned with annotations */}
        <section
          id="example"
          className="w-full py-12 md:py-20 lg:py-24 bg-background"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  See what you'll get
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Preview a sample style guide with all the sections you'll
                  receive
                </p>
              </div>
            </div>

            {/* Style Guide Document Preview with Annotations */}
            <div className="mx-auto max-w-5xl py-8 relative">
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden dark:bg-gray-950 dark:border-gray-800 relative">
                {/* Document Header */}
                <div className="p-8 border-b dark:border-gray-800 relative">
                  <div className="max-w-3xl mx-auto">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      ACME Inc. – Brand Voice & Style Guide
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                      Brand Voice & Style Guide
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                      Created on {new Date().toLocaleDateString()}
                    </p>
                  </div>

                  {/* Header Annotation */}
                  <div className="absolute -right-4 top-8 md:right-8 md:top-4 bg-primary/10 border border-primary/20 rounded-lg p-3 max-w-[180px] md:max-w-[220px] shadow-sm">
                    <div className="text-sm font-medium">
                      Professional Header
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Branded header with your company name and creation date
                    </p>
                    <div className="absolute w-6 h-6 bg-primary/10 border border-primary/20 rotate-45 -left-3 top-5 md:-top-3 md:left-5"></div>
                  </div>
                </div>

                {/* Document Content */}
                <div className="p-8">
                  <div className="max-w-3xl mx-auto space-y-12">
                    {/* About Section */}
                    <section className="relative">
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                        About ACME Inc.
                      </h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        ACME Inc. builds modern tools that empower teams to work
                        smarter, communicate clearly, and grow with confidence.
                        This guide ensures everyone—from writers to
                        developers—speaks in one consistent voice.
                      </p>

                      {/* About Annotation */}
                      <div className="absolute -left-4 top-0 md:-left-40 md:top-0 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 max-w-[180px] md:max-w-[220px] shadow-sm">
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-400">
                          Company Overview
                        </div>
                        <p className="text-xs text-blue-600/80 dark:text-blue-300/80">
                          Concise description of your brand's mission and
                          purpose
                        </p>
                        <div className="absolute w-6 h-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rotate-45 -right-3 top-5 md:right-auto md:-right-3 md:top-5"></div>
                      </div>
                    </section>

                    {/* Brand Voice Section */}
                    <section className="relative">
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                        Brand Voice
                      </h2>
                      <p className="text-gray-700 dark:text-gray-300 font-medium mb-4">
                        <strong>
                          Our voice is confident, warm, and efficient.
                        </strong>
                      </p>
                      <ul className="space-y-6">
                        <li className="bg-gray-50 dark:bg-gray-900 p-5 rounded-lg">
                          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                            Confident but approachable
                          </h3>
                          <div className="grid gap-2">
                            <div className="flex gap-2">
                              <span className="text-emerald-600 dark:text-emerald-500 font-medium">
                                Do:
                              </span>
                              <span className="text-gray-700 dark:text-gray-300">
                                "We've helped 1,200+ teams simplify their
                                content."
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-rose-600 dark:text-rose-500 font-medium">
                                Don't:
                              </span>
                              <span className="text-gray-700 dark:text-gray-300">
                                "We're the world's #1 content solution—just
                                trust us."
                              </span>
                            </div>
                          </div>
                        </li>
                      </ul>

                      {/* Brand Voice Annotation */}
                      <div className="absolute -right-4 top-12 md:right-8 md:top-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 max-w-[180px] md:max-w-[220px] shadow-sm">
                        <div className="text-sm font-medium text-green-700 dark:text-green-400">
                          Voice Definition
                        </div>
                        <p className="text-xs text-green-600/80 dark:text-green-300/80">
                          Clear personality traits with practical do's and
                          don'ts examples
                        </p>
                        <div className="absolute w-6 h-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rotate-45 -left-3 top-5 md:-top-3 md:left-5"></div>
                      </div>
                    </section>

                    {/* Grammar & Mechanics Section */}
                    <section className="relative">
                      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                        Grammar & Mechanics
                      </h2>
                      <ul className="space-y-6">
                        <li className="bg-gray-50 dark:bg-gray-900 p-5 rounded-lg">
                          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                            Use American English
                          </h3>
                          <div className="grid gap-2">
                            <div className="flex gap-2">
                              <span className="text-emerald-600 dark:text-emerald-500 font-medium">
                                Do:
                              </span>
                              <span className="text-gray-700 dark:text-gray-300">
                                "Color", "Optimize"
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-rose-600 dark:text-rose-500 font-medium">
                                Don't:
                              </span>
                              <span className="text-gray-700 dark:text-gray-300">
                                "Colour", "Optimise"
                              </span>
                            </div>
                          </div>
                        </li>
                      </ul>

                      {/* Grammar Annotation */}
                      <div className="absolute -left-4 top-8 md:-left-40 md:top-8 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 max-w-[180px] md:max-w-[220px] shadow-sm">
                        <div className="text-sm font-medium text-purple-700 dark:text-purple-400">
                          Writing Rules
                        </div>
                        <p className="text-xs text-purple-600/80 dark:text-purple-300/80">
                          99+ specific grammar and mechanics rules used by top
                          brands
                        </p>
                        <div className="absolute w-6 h-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rotate-45 -right-3 top-5 md:right-auto md:-right-3 md:top-5"></div>
                      </div>
                    </section>

                    {/* Preview Footer */}
                    <div className="flex justify-center">
                      <Button
                        onClick={() => router.push("/brand-details")}
                        className="gap-2"
                      >
                        Create your own style guide{" "}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Annotation */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 max-w-[280px] md:max-w-[320px] shadow-sm text-center">
                <div className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Multiple Export Formats
                </div>
                <p className="text-xs text-amber-600/80 dark:text-amber-300/80">
                  Download as PDF, Markdown, DOCX, or HTML for Notion
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="pricing"
          className="w-full py-12 md:py-20 lg:py-24 bg-muted"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Pay once, use forever
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  No subscriptions or hidden fees
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-8 md:grid-cols-3">
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <h3 className="text-2xl font-bold">Core Style Guide</h3>
                    <div className="space-y-1">
                      <p className="text-5xl font-bold">$99</p>
                      <p className="text-sm text-muted-foreground">
                        One-time payment
                      </p>
                    </div>
                    <ul className="space-y-2 text-left">
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>Brand voice definition</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>25 essential writing rules</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>Tone guidelines</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>Do's and don'ts</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>PDF & Markdown formats</span>
                      </li>
                    </ul>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => router.push("/brand-details")}
                    >
                      Get Core Guide
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-primary">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background"></div>
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">
                  Popular
                </div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <h3 className="text-2xl font-bold">Complete Style Guide</h3>
                    <div className="space-y-1">
                      <p className="text-5xl font-bold">$149</p>
                      <p className="text-sm text-muted-foreground">
                        One-time payment
                      </p>
                    </div>
                    <ul className="space-y-2 text-left">
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>Everything in Core Guide</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>99+ modern writing rules</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>Used by Apple, Spotify, BBC</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>Formatting standards</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>Example corrections</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>Unlimited revisions</span>
                      </li>
                    </ul>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => router.push("/brand-details")}
                    >
                      Get Complete Guide
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-background dark:from-purple-900/20"></div>
                <div className="absolute top-0 right-0 bg-purple-600 text-primary-foreground px-3 py-1 text-xs font-medium">
                  Enterprise
                </div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <h3 className="text-2xl font-bold">Custom Enterprise</h3>
                    <div className="space-y-1">
                      <p className="text-5xl font-bold">Contact</p>
                      <p className="text-sm text-muted-foreground">
                        Custom pricing
                      </p>
                    </div>
                    <ul className="space-y-2 text-left">
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>Everything in Complete Guide</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>Custom onboarding</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>Dedicated account manager</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>Team training sessions</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>Custom integrations</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                        <span>Priority support</span>
                      </li>
                    </ul>
                    <Button
                      size="lg"
                      className="w-full"
                      variant="outline"
                      asChild
                    >
                      <Link href="mailto:enterprise@styleguideai.com">
                        Contact Sales
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="w-full py-12 md:py-20 lg:py-24 bg-background"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Got questions?
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We've got answers
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-3xl divide-y py-8">
              {[
                {
                  q: "What if I don't have a brand yet?",
                  a: "No problem! Our tool can help you define your brand voice from scratch. Just answer a few questions about your target audience and goals.",
                },
                {
                  q: "Can I edit the output?",
                  a: "Yes! After we generate your style guide, you can review and edit any section before downloading the final version. You can also regenerate specific sections if needed.",
                },
                {
                  q: "Is this better than hiring a writer?",
                  a: "Our AI tool provides a comprehensive starting point in minutes instead of weeks. While professional writers offer customized expertise, our tool delivers 90% of what most brands need at a fraction of the cost.",
                },
                {
                  q: "How is this different from other tools?",
                  a: "Unlike generic templates or complex brand management platforms, we focus exclusively on creating practical, actionable style guides with specific rules and examples tailored to your brand.",
                },
                {
                  q: "How long does it take to generate a style guide?",
                  a: "Most style guides are generated in under 2 minutes. You can then review and make any adjustments before downloading the final version.",
                },
                {
                  q: "Can I share my style guide with my team?",
                  a: "You can download your style guide in multiple formats (PDF, Markdown, DOCX, HTML) and share it with your entire team. You'll also receive a permanent access link via email.",
                },
                {
                  q: "Do you offer refunds if I'm not satisfied?",
                  a: "Yes, we offer a 14-day money-back guarantee. If you're not completely satisfied with your style guide, contact our support team for a full refund.",
                },
                {
                  q: "Can I update my style guide later?",
                  a: "Yes! Your purchase includes unlimited revisions. You can come back anytime to update your brand details and regenerate your style guide as your brand evolves.",
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
        <section className="w-full py-12 md:py-20 lg:py-24 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Start writing with clarity today
                </h2>
                <p className="max-w-[700px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Create your brand style guide in minutes and improve all your
                  content
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-1"
                  onClick={() => {
                    // Scroll to hero section
                    document
                      .getElementById("hero")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Generate your style guide <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-1 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <Link href="#example">
                    <FileDown className="h-4 w-4" /> See example first
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
