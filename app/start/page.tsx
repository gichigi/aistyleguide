import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, Loader2, AlertTriangle, ArrowRight } from "lucide-react"

export default function StartPage() {
  const router = useRouter()
  const [isExtracting, setIsExtracting] = useState(false)
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [manualDetails, setManualDetails] = useState("")
  const [showCharCount, setShowCharCount] = useState(false)
  const [tone, setTone] = useState("friendly")

  // URL validation function (copied from homepage)
  const isValidUrl = (urlString: string): boolean => {
    try {
      if (!urlString.trim()) return true
      const urlToCheck = urlString.match(/^https?:\/\//) ? urlString : `https://${urlString}`
      new URL(urlToCheck)
      return urlToCheck.includes(".") && urlToCheck.match(/^https?:\/\/[^.]+\..+/) !== null
    } catch (e) {
      return false
    }
  }

  const handleExtraction = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSuccess(false)
    setIsExtracting(false)
    if (!url.trim()) {
      router.push("/brand-details")
      return
    }
    if (!isValidUrl(url)) {
      setError("Please enter a valid URL (e.g., example.com)")
      return
    }
    setIsExtracting(true)
    try {
      let formattedUrl = url.trim()
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = "https://" + formattedUrl
      }
      const response = await fetch("/api/extract-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formattedUrl }),
      })
      const data = await response.json()
      if (data.success) {
        sessionStorage.setItem("brandDetails", JSON.stringify(data.brandDetails))
        setIsSuccess(true)
        setIsExtracting(false)
        setTimeout(() => {
          router.push("/brand-details?fromExtraction=true")
        }, 800)
      } else {
        setIsExtracting(false)
        setIsSuccess(false)
        router.push("/brand-details?fromExtraction=true")
      }
    } catch (error) {
      setError("There was a problem analyzing this website. Please try again or enter details manually.")
      setIsExtracting(false)
      setIsSuccess(false)
    }
  }

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualDetails.trim()) return
    sessionStorage.setItem("brandDetails", JSON.stringify({ brandDetailsText: manualDetails, tone }))
    router.push("/brand-details")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12">
      <Card className="w-full max-w-xl mx-auto shadow-lg border-2 border-gray-200 bg-white/90">
        <CardContent className="py-10 px-6">
          <h1 className="text-3xl font-bold mb-6 text-center">Generate your style guide</h1>
          <Tabs defaultValue="website" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="website">Analyze a Website</TabsTrigger>
              <TabsTrigger value="manual">Enter Manually</TabsTrigger>
            </TabsList>
            <TabsContent value="website">
              <form onSubmit={handleExtraction} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter website URL"
                    className={`pl-10 py-6 text-lg ${error ? "border-red-500 focus-visible:ring-red-500" : ""} ${isSuccess ? "border-green-500 focus-visible:ring-green-500 bg-green-50" : ""}`}
                    value={url}
                    onChange={e => {
                      setUrl(e.target.value)
                      if (error) setError("")
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
                  className={`w-full py-6 text-lg transition-all duration-300 ${isSuccess ? "bg-green-500 hover:bg-green-600" : ""}`}
                  disabled={isExtracting || isSuccess}
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Checking your site...
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Success
                    </>
                  ) : (
                    <>
                      Generate your style guide <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="manual">
              <form onSubmit={handleManual} className="space-y-4">
                <textarea
                  id="manualDetails"
                  name="manualDetails"
                  placeholder="Nike is a leading sports brand, selling a wide range of workout products, services and experiences worldwide. Nike targets athletes and sports enthusiasts globally, focusing on those who want high-quality sportswear and equipment."
                  value={manualDetails}
                  onChange={e => {
                    setManualDetails(e.target.value)
                    setShowCharCount(true)
                    e.target.style.height = "auto"
                    e.target.style.height = e.target.scrollHeight + "px"
                  }}
                  rows={4}
                  className="resize-none min-h-[40px] max-h-[200px] w-full border rounded-md p-4 text-lg"
                  onFocus={e => setShowCharCount(true)}
                  onBlur={e => setShowCharCount(!!e.target.value)}
                  maxLength={500}
                />
                {showCharCount && (
                  <div className={`text-xs mt-1 ${manualDetails.length > 450 ? 'text-yellow-600' : 'text-muted-foreground'}`}>{manualDetails.length}/500 characters</div>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full py-6 text-lg"
                  disabled={!manualDetails.trim()}
                >
                  Generate your style guide <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 