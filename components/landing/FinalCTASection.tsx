import { Button } from "@/components/ui/button";
import { ArrowRight, FileDown } from "lucide-react";
import Link from "next/link";
import React from "react";

export function FinalCTASection() {
  return (
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
  );
}
