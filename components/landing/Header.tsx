import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
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
          <Link href="#faq" className="text-sm font-medium hover:text-primary">
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
  );
}
