import Link from "next/link"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"
import { ReactNode } from "react"

interface HeaderProps {
  showNavigation?: boolean
  showGetStarted?: boolean
  variant?: "default" | "minimal"
  rightContent?: ReactNode
}

export default function Header({ 
  showNavigation = false, 
  showGetStarted = false,
  variant = "minimal",
  rightContent
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Logo size="md" linkToHome={true} />
        
        {showNavigation && (
          <nav className="hidden md:flex gap-6">
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary">
              How It Works
            </Link>
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
            <Link href="#faq" className="text-sm font-medium hover:text-primary">
              FAQ
            </Link>
          </nav>
        )}
        
        {showGetStarted && (
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
        )}
        
        {rightContent && (
          <div className="flex items-center gap-4">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  )
} 