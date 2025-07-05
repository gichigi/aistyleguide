import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Brand name utility - single source of truth
export const getBrandName = (brandDetails: any): string => {
  // Use provided brand name if available and not empty
  if (brandDetails?.brandName && brandDetails.brandName.trim()) {
    return brandDetails.brandName.trim()
  }
  
  // Fall back to generic placeholder
  return "Your Brand"
}
