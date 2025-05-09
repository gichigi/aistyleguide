import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export function ExampleOutputSection() {
  const router = useRouter();
  return (
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
              Preview a sample style guide with all the sections you'll receive
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
                <div className="text-sm font-medium">Professional Header</div>
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
                    smarter, communicate clearly, and grow with confidence. This
                    guide ensures everyone—from writers to developers—speaks in
                    one consistent voice.
                  </p>
                  {/* About Annotation */}
                  <div className="absolute -left-4 top-0 md:-left-40 md:top-0 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 max-w-[180px] md:max-w-[220px] shadow-sm">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      Company Overview
                    </div>
                    <p className="text-xs text-blue-600/80 dark:text-blue-300/80">
                      Concise description of your brand's mission and purpose
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
                            "We've helped 1,200+ teams simplify their content."
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-rose-600 dark:text-rose-500 font-medium">
                            Don't:
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            "We're the world's #1 content solution—just trust
                            us."
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
                      Clear personality traits with practical do's and don'ts
                      examples
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
  );
}
