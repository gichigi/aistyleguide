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
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { WhoItsForSection } from "@/components/landing/WhoItsForSection";
import { ExampleOutputSection } from "@/components/landing/ExampleOutputSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";

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
      <Header />
      <main className="flex-1">
        <HeroSection
          url={url}
          setUrl={setUrl}
          error={error}
          isSuccess={isSuccess}
          isExtracting={isExtracting}
          handleExtraction={handleExtraction}
        />
        <HowItWorksSection />
        <FeaturesSection />
        <WhoItsForSection />
        <ExampleOutputSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
    </div>
  );
}
