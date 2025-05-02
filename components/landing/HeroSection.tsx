import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Loader2,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import React from "react";

interface HeroSectionProps {
  url: string;
  setUrl: (url: string) => void;
  error: string;
  isSuccess: boolean;
  isExtracting: boolean;
  handleExtraction: (e: React.FormEvent) => void;
}

export function HeroSection({
  url,
  setUrl,
  error,
  isSuccess,
  isExtracting,
  handleExtraction,
}: HeroSectionProps) {
  return (
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
            AI-generated voice and writing rules tailored to your brand — ready
            to export and share.
          </p>

          <form onSubmit={handleExtraction} className="w-full max-w-2xl">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  type="text"
                  placeholder="Enter website URL"
                  className={`pl-10 py-6 text-lg ${
                    error ? "border-red-500 focus-visible:ring-red-500" : ""
                  } ${
                    isSuccess
                      ? "border-green-500 focus-visible:ring-green-500 bg-green-50"
                      : ""
                  }`}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
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
  );
}
