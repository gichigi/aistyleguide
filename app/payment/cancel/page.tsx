"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CancelPage() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    toast({
      title: "Payment cancelled",
      description: "Your payment was cancelled. You can try again if you'd like.",
      variant: "default",
    })
  }, [toast])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-950 rounded-xl shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Your payment was cancelled. You can try again if you'd like.
          </p>
          
          {/* Add guarantee to reduce anxiety */}
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-6">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="font-medium">Risk-free with our 30-day money-back guarantee</span>
          </div>
          
          {/* Add easy refund info */}
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Easy refunds available</h4>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              If you change your mind after purchasing, simply email us for a quick refund:
            </p>
            <a
              href="mailto:support@aistyleguide.com?subject=Refund%20Request%20-%20Style%20Guide%20Purchase&body=Hi%20AIStyleGuide%20Support%20Team,%0A%0AI%20would%20like%20to%20request%20a%20refund%20for%20my%20style%20guide%20purchase.%0A%0APurchase%20Details:%0A- Guide%20Type:%20[Core%20or%20Complete]%0A- Purchase%20Date:%20[Date]%0A- Email%20used%20for%20purchase:%20[Email]%0A%0AReason%20for%20refund%20(optional):%20%0A%0AThanks,%0A[Your%20Name]"
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
            >
              support@aistyleguide.com
            </a>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
              Usually processed within 1-2 business days
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <Button
            onClick={() => router.push("/preview")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Preview
          </Button>
        </div>
      </div>
    </div>
  )
} 