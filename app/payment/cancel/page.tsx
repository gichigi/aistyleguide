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