"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

// Default brand details
const defaultBrandDetails = {
  name: "Style Guide AI",
  description: "A web app that generates brand voice and content style guides",
  audience:
    "marketing professionals aged 25-45 who are interested in branding, content creation, and efficiency",
  tone: "friendly",
};

// Custom hook for auto-resizing textarea
function useAutoResizeTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = ref.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return ref;
}

export default function BrandDetailsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const fromExtraction = searchParams.get("fromExtraction") === "true";
  const fromPayment = searchParams.get("paymentComplete") === "true";
  const guideType =
    searchParams.get("guideType") ||
    localStorage.getItem("styleGuidePlan") ||
    "core";
  console.log("guideType", guideType);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  // Initialize state with default values to ensure inputs are always controlled
  const [brandDetails, setBrandDetails] = useState({ ...defaultBrandDetails });

  // Trigger fade-in animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Check payment status only once on component mount
  useEffect(() => {
    const isComplete =
      localStorage.getItem("styleGuidePaymentStatus") === "completed" ||
      fromPayment;
    setPaymentComplete(isComplete);
  }, [fromPayment]);

  // Load saved brand details from session storage
  useEffect(() => {
    const savedDetails = sessionStorage.getItem("brandDetails");
    if (savedDetails) {
      try {
        const parsedDetails = JSON.parse(savedDetails);
        // Ensure all required fields have values by merging with defaults
        const updatedDetails = {
          ...defaultBrandDetails,
          ...parsedDetails,
          // Map targetAudience to audience if needed
          audience:
            parsedDetails.targetAudience ||
            parsedDetails.audience ||
            defaultBrandDetails.audience,
          // Always ensure tone has a valid value
          tone: parsedDetails.tone || "friendly",
        };

        setBrandDetails(updatedDetails);

        // Update session storage with the validated details
        sessionStorage.setItem("brandDetails", JSON.stringify(updatedDetails));
      } catch (e) {
        console.error("Error parsing saved brand details:", e);
        // If there's an error parsing, ensure we save the default details
        sessionStorage.setItem(
          "brandDetails",
          JSON.stringify(defaultBrandDetails)
        );
        setBrandDetails(defaultBrandDetails);
      }
    } else {
      // If no saved details, initialize sessionStorage with default values
      sessionStorage.setItem(
        "brandDetails",
        JSON.stringify(defaultBrandDetails)
      );
      setBrandDetails(defaultBrandDetails);
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Add validation for each field
    let validatedValue = value;

    if (name === "name") {
      // Brand name: max 50 chars, no special chars
      validatedValue = value.replace(/[^a-zA-Z0-9\s-]/g, "").slice(0, 50);
    } else if (name === "description") {
      // Description: max 500 chars
      validatedValue = value.slice(0, 500);
    } else if (name === "audience") {
      // Audience: max 500 chars
      validatedValue = value.slice(0, 500);
    }

    // Validate the field
    validateField(name, validatedValue);

    setBrandDetails((prev) => {
      const updatedDetails = { ...prev, [name]: validatedValue };
      // Save to session storage
      sessionStorage.setItem("brandDetails", JSON.stringify(updatedDetails));
      return updatedDetails;
    });
  };

  const descriptionRef = useAutoResizeTextarea(brandDetails.description || "");
  const audienceValue = Array.isArray(brandDetails.audience)
    ? brandDetails.audience
        .map((item: string) => (item.startsWith("•") ? item : `• ${item}`))
        .join("\n")
    : brandDetails.audience || "";
  const audienceRef = useAutoResizeTextarea(audienceValue);

  // Add character count display component
  const CharacterCount = ({ value, max }: { value: string; max: number }) => {
    const count = value.length;
    const isNearLimit = count > max * 0.8;
    const isOverLimit = count > max;

    return (
      <div
        className={`text-xs mt-1 ${isNearLimit ? "text-yellow-600" : ""} ${
          isOverLimit ? "text-red-600" : "text-muted-foreground"
        }`}
      >
        {count}/{max} characters
      </div>
    );
  };

  // Add field validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Update validation function
  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = {};

    if (name === "name") {
      if (!value.trim()) {
        errors[name] = "Brand name is required";
      } else if (value.length > 50) {
        errors[name] = "Brand name must be 50 characters or less";
      }
    } else if (name === "description") {
      if (!value.trim()) {
        errors[name] = "Description is required";
      } else if (value.length > 500) {
        errors[name] = "Description must be 500 characters or less";
      }
    } else if (name === "audience") {
      if (!value.trim()) {
        errors[name] = "Target audience is required";
      } else if (value.length > 500) {
        errors[name] = "Target audience must be 500 characters or less";
      }
    }

    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  // Update handleSelectChange to ensure tone is always set
  const handleSelectChange = (name: string, value: string) => {
    if (name === "tone" && !value) {
      value = "friendly"; // Ensure tone always has a value
    }

    setBrandDetails((prev) => {
      const updatedDetails = { ...prev, [name]: value };
      // Save to session storage
      sessionStorage.setItem("brandDetails", JSON.stringify(updatedDetails));
      return updatedDetails;
    });
  };

  // Update isFormValid function
  const isFormValid = () => {
    // Check if any field errors exist
    if (Object.keys(fieldErrors).length > 0) return false;

    // Check if all required fields have content
    if (
      !brandDetails?.name?.trim() ||
      !brandDetails?.description?.trim() ||
      !brandDetails?.audience
    ) {
      return false;
    }

    // Check field lengths
    if (
      brandDetails.name.length > 50 ||
      brandDetails.description.length > 500 ||
      brandDetails.audience.length > 500
    ) {
      return false;
    }

    return true;
  };

  // Update the handleSubmit function to include validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For preview mode, use the preview template
      if (!paymentComplete) {
        const response = await fetch("/api/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandDetails: brandDetails,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate preview");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to generate preview");
        }

        // Save brand details and preview
        sessionStorage.setItem("brandDetails", JSON.stringify(brandDetails));
        sessionStorage.setItem("previewContent", data.preview);

        // Redirect to preview page
        router.push("/preview");
        return;
      }

      // For paid users, generate full style guide
      const response = await fetch("/api/generate-styleguide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandInfo: brandDetails,
          plan: guideType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate style guide");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate style guide");
      }

      // Save generated style guide to localStorage
      localStorage.setItem("generatedStyleGuide", data.styleGuide);

      // Save brand details and redirect to full access page
      sessionStorage.setItem("brandDetails", JSON.stringify(brandDetails));
      router.push("/full-access");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 h-16 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 min-w-0 max-w-[180px] sm:max-w-none"
          >
            <FileText className="h-5 w-5 flex-shrink-0" />
            <span className="text-lg font-semibold truncate whitespace-nowrap">
              Style Guide AI
            </span>
          </Link>
        </div>
      </header>
      <main
        className={`flex-1 container py-12 transition-opacity duration-500 ease-in-out ${
          fadeIn ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          {paymentComplete && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/20 dark:border-green-800">
              <h3 className="font-medium text-green-800 dark:text-green-400">
                Full Access Unlocked
              </h3>
              <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                You've purchased full access to the style guide. Complete your
                brand details to generate your guide.
              </p>
            </div>
          )}

          {fromExtraction && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
              <h3 className="font-medium text-blue-800 dark:text-blue-400">
                Content Found!
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-500 mt-1">
                We found your brand info and filled in the details. Take a quick
                look and make any changes.
              </p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Brand details</CardTitle>
              <CardDescription>
                Tell us about your brand to create a personalized style guide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Brand name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={brandDetails.name || ""}
                      onChange={handleChange}
                      maxLength={50}
                      className={fieldErrors.name ? "border-red-500" : ""}
                    />
                    <CharacterCount value={brandDetails.name || ""} max={50} />
                    {fieldErrors.name && (
                      <p className="text-sm text-red-500">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">
                      What does your brand do?
                    </Label>
                    <Textarea
                      ref={descriptionRef}
                      id="description"
                      name="description"
                      value={brandDetails.description || ""}
                      onChange={handleChange}
                      maxLength={500}
                      className={
                        fieldErrors.description ? "border-red-500" : ""
                      }
                    />
                    <CharacterCount
                      value={brandDetails.description || ""}
                      max={500}
                    />
                    {fieldErrors.description && (
                      <p className="text-sm text-red-500">
                        {fieldErrors.description}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="target-audience">Target audience</Label>
                    <Textarea
                      ref={audienceRef}
                      id="target-audience"
                      name="audience"
                      placeholder="e.g., marketing professionals aged 25-45 interested in branding and content creation"
                      value={audienceValue}
                      onChange={handleChange}
                      maxLength={500}
                      className={fieldErrors.audience ? "border-red-500" : ""}
                    />
                    <CharacterCount value={audienceValue} max={500} />
                    {fieldErrors.audience && (
                      <p className="text-sm text-red-500">
                        {fieldErrors.audience}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Describe who your brand serves, including their age,
                      interests, needs, and any other relevant details
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tone">Preferred tone</Label>
                    <Select
                      onValueChange={(value) =>
                        handleSelectChange("tone", value)
                      }
                      value={brandDetails.tone || "friendly"}
                      defaultValue="friendly"
                    >
                      <SelectTrigger id="tone" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="professional">
                          Professional
                        </SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading || !isFormValid()}
                    className="w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : paymentComplete ? (
                      "Generate Full Style Guide"
                    ) : (
                      "Generate Style Guide Preview"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
