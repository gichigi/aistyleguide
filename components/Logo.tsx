import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  linkToHome?: boolean
}

export default function Logo({ size = "md", linkToHome = true }: LogoProps) {
  const sizeClasses = {
    sm: {
      container: "w-6 h-6",
      icon: "h-4 w-4",
      text: "text-base",
      gap: "gap-2",
    },
    md: {
      container: "w-8 h-8",
      icon: "h-5 w-5",
      text: "text-xl",
      gap: "gap-3",
    },
    lg: {
      container: "w-10 h-10",
      icon: "h-6 w-6",
      text: "text-2xl",
      gap: "gap-3",
    },
  }

  // Custom stylized icon combining a document, styleguide, and AI elements
  const CustomIcon = () => (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses[size].icon} transform transition-all duration-300 group-hover:scale-110`}
    >
      {/* Stylized document base */}
      <path 
        d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.342a2 2 0 0 0-.586-1.414l-3.342-3.342A2 2 0 0 0 14.658 3H6a2 2 0 0 0-2 2z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        className="text-primary"
      />
      
      {/* Style guide elements - horizontal lines */}
      <path 
        d="M8 10h8M8 14h5M8 18h8" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        className="text-primary/70"
      />
      
      {/* AI circuit/neural network element */}
      <path 
        d="M14 14l4 4m-4 0l4-4" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        className="text-blue-500"
      />
    </svg>
  )

  const logoContent = (
    <div className={`group flex items-center ${sizeClasses[size].gap}`}>
      <div className={`relative flex items-center justify-center ${sizeClasses[size].container} rounded-lg bg-gradient-to-br from-blue-100 to-accent-gray/30 shadow-sm overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-blue-400/10 opacity-70"></div>
        <CustomIcon />
      </div>
      <span className={`${sizeClasses[size].text} font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400`}>
        AIStyleGuide
      </span>
    </div>
  )

  if (linkToHome) {
    return (
      <Link href="/" className="flex items-center min-w-0 max-w-[180px] sm:max-w-none">
        {logoContent}
      </Link>
    )
  }

  return logoContent
} 