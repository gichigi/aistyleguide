"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Loader2, Download, Check, X } from "lucide-react"
import { generateFile, FileFormat } from "@/lib/file-generator"
import { useToast } from "@/hooks/use-toast"
import Header from "@/components/Header"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"

const MODELS = [
  { label: "GPT-4o", value: "gpt-4o" },
  { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
]

const PLANS = [
  { label: "Core Guide", value: "core" },
  { label: "Complete Guide", value: "complete" },
]

const DEFAULT_BRAND = {
  name: "Test Brand",
  description: "A test brand for style guide generation.",
  audience: "marketers, writers, and designers",
  tone: "friendly",
}

export default function TestPage() {
  const { toast } = useToast()
  const [brand, setBrand] = useState(DEFAULT_BRAND)
  const [plan, setPlan] = useState("core")
  const [model, setModel] = useState("gpt-4o")
  const [temperature, setTemperature] = useState(0.6)
  const [output, setOutput] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [log, setLog] = useState<{ label: string; status: "pending" | "done" | "error"; error?: string }[]>([])
  const [downloadFormat, setDownloadFormat] = useState<FileFormat | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Character counters
  const descriptionCharCount = brand.description.length
  const audienceCharCount = brand.audience.length
  const maxDescriptionChars = 500
  const maxAudienceChars = 500

  // Helper to update log
  const updateLog = (label: string, status: "pending" | "done" | "error", error?: string) => {
    setLog((prev) => {
      const idx = prev.findIndex((l) => l.label === label)
      if (idx !== -1) {
        const updated = [...prev]
        updated[idx] = { label, status, error }
        return updated
      }
      return [...prev, { label, status, error }]
    })
  }

  // Handle brand input changes
  const handleBrandChange = (field: string, value: string) => {
    setBrand((prev) => ({ ...prev, [field]: value }))
  }

  // Main test function
  const runTest = async () => {
    setIsLoading(true)
    setOutput(null)
    setLog([])
    updateLog("Extracting brand info", "pending")
    try {
      // Simulate extraction (replace with real API if needed)
      await new Promise((res) => setTimeout(res, 500))
      updateLog("Extracting brand info", "done")
    } catch (e: any) {
      updateLog("Extracting brand info", "error", e.message)
      setIsLoading(false)
      return
    }
    // Style Guide API call
    updateLog("Generating style guide", "pending")
    try {
      const response = await fetch("/api/generate-styleguide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandDetails: brand,
          plan,
          model,
          temperature,
        }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Failed to generate style guide")
      updateLog("Generating style guide", "done")
      // If complete, log example generation
      if (plan === "complete") {
        updateLog("Generating examples", "pending")
        // Simulate example API call (replace with real API if needed)
        await new Promise((res) => setTimeout(res, 500))
        updateLog("Generating examples", "done")
      }
      updateLog("Rendering output", "pending")
      setOutput(data.styleGuide)
      updateLog("Rendering output", "done")
    } catch (e: any) {
      updateLog("Generating style guide", "error", e.message)
      setIsLoading(false)
      return
    }
    setIsLoading(false)
  }

  // Download handler
  const handleDownload = async (format: FileFormat) => {
    if (!output) return
    setIsDownloading(true)
    setDownloadFormat(format)
    try {
      const file = await generateFile(format, output, brand.name)
      const url = window.URL.createObjectURL(file)
      const a = document.createElement("a")
      a.href = url
      a.download = `${brand.name.replace(/\s+/g, '-').toLowerCase()}-style-guide.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Download started",
        description: `Your style guide is downloading in ${format.toUpperCase()} format.`,
      })
    } catch (e) {
      toast({
        title: "Download failed",
        description: "Could not generate the file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
      setDownloadFormat(null)
    }
  }

  // Add this function at the top-level of the component
  const exportPDF = async () => {
    const element = document.getElementById('pdf-content')
    if (!element) return
    const html2pdf = (await import('html2pdf.js')).default
    const opt = {
      margin: 0.5,
      filename: 'style-guide.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  // Test markdown content to prove Phase 2 works
  const testMarkdown = `# ✅ Phase 2 Test: MarkdownRenderer vs dangerouslySetInnerHTML

## Brand Voice Traits 🎯

### Clear & Concise

#### What It Means
→ Use simple, direct language that anyone can understand.
→ Break down complex ideas into **easy steps**.
→ Keep sentences short and to the point.

#### What It Doesn't Mean
✗ Leaving out important details for brevity.
✗ Using jargon without explanation.

### Friendly & Approachable 😊

**Special Characters Test:**
- Smart quotes: "These should render correctly"
- Dashes: em-dash — vs hyphen -  
- Symbols: © ® ™ € $ £ ¥
- Emojis: 🎉 ✅ ❌ 🚀

---

**This proves our new MarkdownRenderer works correctly!**`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-1 container py-8 max-w-7xl">
        
        {/* Phase 2 Proof Test */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 text-green-800">🔬 Phase 2 Implementation Proof</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-red-700">❌ OLD: dangerouslySetInnerHTML</h3>
                <div className="prose prose-slate max-w-none border p-4 bg-red-50 rounded">
                  <div dangerouslySetInnerHTML={{ __html: testMarkdown.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-green-700">✅ NEW: MarkdownRenderer</h3>
                <div className="border p-4 bg-white rounded">
                  <MarkdownRenderer content={testMarkdown} />
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              <strong>Notice:</strong> The new MarkdownRenderer properly handles emojis, special characters, 
              formatting, and provides consistent spacing - while the old approach breaks formatting.
            </p>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Controls */}
          <Card className="md:col-span-1">
            <CardContent className="space-y-6 p-6">
              <h2 className="text-xl font-bold mb-2">Test Controls</h2>
              <div className="space-y-2">
                <label className="block font-medium">Brand Name</label>
                <Input value={brand.name} onChange={e => handleBrandChange("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="block font-medium">Description</label>
                <Textarea value={brand.description} onChange={e => handleBrandChange("description", e.target.value)} />
                <div className={`text-xs text-right ${descriptionCharCount > maxDescriptionChars ? 'text-red-500' : 'text-gray-400'}`}>{descriptionCharCount}/{maxDescriptionChars}</div>
              </div>
              <div className="space-y-2">
                <label className="block font-medium">Audience</label>
                <Textarea value={brand.audience} onChange={e => handleBrandChange("audience", e.target.value)} />
                <div className={`text-xs text-right ${audienceCharCount > maxAudienceChars ? 'text-red-500' : 'text-gray-400'}`}>{audienceCharCount}/{maxAudienceChars}</div>
              </div>
              <div className="space-y-2">
                <label className="block font-medium">Tone</label>
                <Input value={brand.tone} onChange={e => handleBrandChange("tone", e.target.value)} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-medium mb-1">Guide Type</label>
                  <Select value={plan} onValueChange={setPlan}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLANS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="block font-medium mb-1">Model</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-medium">Temperature</label>
                <Input type="number" step="0.1" min="0" max="2" value={temperature} onChange={e => setTemperature(Number(e.target.value))} />
              </div>
              <Button className="w-full mt-4" onClick={runTest} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Run Test
              </Button>
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Checklist</h3>
                <ul className="space-y-2">
                  {log.map((item, i) => (
                    <li key={item.label} className="flex items-center gap-2">
                      {item.status === "done" && <Check className="text-green-600 w-4 h-4" />}
                      {item.status === "pending" && <Loader2 className="animate-spin w-4 h-4 text-blue-500" />}
                      {item.status === "error" && <X className="text-red-600 w-4 h-4" />}
                      <span>{item.label}</span>
                      {item.error && <span className="text-red-500 text-xs ml-2">{item.error}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
          {/* Right: Output */}
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Output Preview</h2>
              {isLoading && <Progress value={log.length * 33} className="mb-4" />}
              {output ? (
                <div id="pdf-content" className="mb-6">
                  <MarkdownRenderer content={output} className="prose-slate dark:prose-invert max-w-none" />
                </div>
              ) : (
                <div className="text-gray-400 italic">No output yet. Run a test to see results.</div>
              )}
              {output && (
                <div className="flex gap-2 mt-4">
                  <Button onClick={exportPDF} disabled={isDownloading}>
                    <Download className="w-4 h-4 mr-2" /> PDF
                  </Button>
                  <Button onClick={() => handleDownload("docx")} disabled={isDownloading}>
                    <Download className="w-4 h-4 mr-2" /> DOCX
                  </Button>
                  <Button onClick={() => handleDownload("html")} disabled={isDownloading}>
                    <Download className="w-4 h-4 mr-2" /> HTML
                  </Button>
                  <Button onClick={() => handleDownload("md")} disabled={isDownloading}>
                    <Download className="w-4 h-4 mr-2" /> Markdown
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 