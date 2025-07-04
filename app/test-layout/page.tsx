"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import Header from "@/components/Header"

const predefinedTraits = [
  "Authoritative", "Witty", "Direct", "Inspiring", 
  "Warm", "Inclusive", "Optimistic", "Passionate",
  "Playful", "Supportive", "Sophisticated", "Thoughtful"
]

const traitDescriptions = {
  "Authoritative": {
    definition: "Confident expertise that educates and guides without being condescending or pushy",
    example: "Here's exactly why this approach works better"
  },
  "Witty": {
    definition: "Clever, sharp humor that shows intelligence without being silly or inappropriate", 
    example: "Our servers decided to take an unscheduled coffee break. Back in 5 minutes!"
  },
  "Direct": {
    definition: "Clear and straightforward communication that gets to the point without unnecessary fluff",
    example: "This feature saves you 2 hours per week. Here's how."
  }
}

export default function TestLayoutPage() {
  // Form state
  const [brandName, setBrandName] = useState("Nike")
  const [brandDescription, setBrandDescription] = useState("Nike is a global leader in athletic footwear, apparel, and equipment. We inspire athletes and everyday people to push their limits and achieve greatness through innovative products and powerful storytelling.")
  const [englishVariant, setEnglishVariant] = useState("american")
  const [formalityLevel, setFormalityLevel] = useState("Neutral")
  const [readingLevel, setReadingLevel] = useState("6-8")
  
  // Trait state
  const [selectedTraits, setSelectedTraits] = useState<string[]>(["Witty"])
  const [customTraits, setCustomTraits] = useState<string[]>(["headstrong"])
  const [customInput, setCustomInput] = useState("")
  const [showInput, setShowInput] = useState(false)

  const togglePredefined = (trait: string) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(prev => prev.filter(t => t !== trait))
    } else if (selectedTraits.length + customTraits.length < 3) {
      setSelectedTraits(prev => [trait, ...prev])
    }
  }

  const removeCustom = (trait: string) => {
    setCustomTraits(prev => prev.filter(t => t !== trait))
  }

  const addCustom = () => {
    if (customInput.trim() && selectedTraits.length + customTraits.length < 3) {
      setCustomTraits(prev => [customInput.trim(), ...prev])
      setCustomInput("")
      setShowInput(false)
    }
  }

  const allSelected = [...selectedTraits, ...customTraits]
  const totalSelected = allSelected.length

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <Card className="shadow-lg border-2 border-gray-200 bg-white/90">
            <CardHeader>
              <CardTitle>About the brand</CardTitle>
              <CardDescription>Tell us about the brand and choose voice traits.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-8">
                {/* Basic Brand Info */}
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Brand Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g. Nike"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="text-base p-4 font-medium placeholder:text-gray-400 placeholder:font-medium"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="brandDescription">Description</Label>
                    <Textarea
                      id="brandDescription"
                      name="brandDescription"
                      placeholder="Describe your brand in a few sentences. What do you do? Who do you serve?"
                      value={brandDescription}
                      onChange={(e) => setBrandDescription(e.target.value)}
                      rows={5}
                      className="resize-none min-h-[120px] leading-relaxed text-base p-4 font-medium placeholder:text-gray-400 placeholder:font-medium"
                    />
                    <div className="text-xs text-muted-foreground">{brandDescription.length}/500 characters</div>
                  </div>
                  
                  {/* Language/Formality Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                    <div className="grid gap-2">
                      <Label htmlFor="englishVariant">Language</Label>
                      <Select value={englishVariant} onValueChange={setEnglishVariant}>
                        <SelectTrigger id="englishVariant" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="american">American English</SelectItem>
                          <SelectItem value="british">British English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="formalityLevel">Formality</Label>
                      <Select value={formalityLevel} onValueChange={setFormalityLevel}>
                        <SelectTrigger id="formalityLevel" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Very Casual">Very Casual</SelectItem>
                          <SelectItem value="Casual">Casual</SelectItem>
                          <SelectItem value="Neutral">Neutral</SelectItem>
                          <SelectItem value="Formal">Formal</SelectItem>
                          <SelectItem value="Very Formal">Very Formal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="readingLevel">Reading Level</Label>
                      <Select value={readingLevel} onValueChange={setReadingLevel}>
                        <SelectTrigger id="readingLevel" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6-8">Grade 6-8 (General Public)</SelectItem>
                          <SelectItem value="10-12">Grade 10-12 (Professional)</SelectItem>
                          <SelectItem value="13+">Grade 13+ (Technical/Academic)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Voice Traits Section */}
                <div className="mt-8">
                  <Label className="text-base font-medium">Brand voice traits</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-6">
                    Pick 3 traits that define the brand personality.
                  </p>
                  
                  {/* Side-by-side layout for traits */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* LEFT PANEL: Selection */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Choose from preset traits</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {predefinedTraits.map((trait) => {
                            const isSelected = selectedTraits.includes(trait)
                            const isDisabled = totalSelected >= 3 && !isSelected
                            return (
                              <button
                                key={trait}
                                onClick={() => togglePredefined(trait)}
                                disabled={isDisabled}
                                type="button"
                                className={`rounded-full px-4 py-2 text-sm border transition-colors ${
                                  isSelected
                                    ? "bg-black text-white border-black"
                                    : isDisabled
                                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                }`}
                              >
                                {trait}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-gray-700">Or add your own</h3>
                          <span className="text-xs text-gray-500">{totalSelected}/3 selected</span>
                        </div>
                        
                        {customTraits.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {customTraits.map((trait) => (
                              <div
                                key={trait}
                                className="flex items-center gap-1 rounded-full px-3 py-1 text-sm border bg-blue-50 text-blue-700 border-blue-300"
                              >
                                <span>{trait}</span>
                                <button
                                  onClick={() => removeCustom(trait)}
                                  className="ml-1 hover:bg-red-100 rounded-full p-0.5 transition-colors"
                                  type="button"
                                >
                                  <X size={12} className="text-gray-500 hover:text-red-600" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {showInput ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                placeholder="Enter custom trait name"
                                className="flex-1"
                                maxLength={20}
                                autoFocus
                              />
                              <Button onClick={addCustom} size="sm" type="button">Add</Button>
                              <Button 
                                onClick={() => {setShowInput(false); setCustomInput("")}} 
                                variant="outline" 
                                size="sm"
                                type="button"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setShowInput(true)}
                            disabled={totalSelected >= 3}
                            variant="outline"
                            size="sm"
                            type="button"
                            className="w-full"
                          >
                            <Plus size={16} className="mr-2" />
                            Add Custom Trait
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* RIGHT PANEL: Live Preview */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-4">
                        Selected Traits ({totalSelected}/3)
                      </h3>
                      
                      {allSelected.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">
                          Select traits to see them here
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {selectedTraits.map((trait) => (
                            <div key={trait} className="bg-white rounded-lg p-4 border">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">✓ {trait}</h4>
                                <button 
                                  onClick={() => togglePredefined(trait)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                  type="button"
                                >
                                  Remove
                                </button>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {traitDescriptions[trait as keyof typeof traitDescriptions]?.definition || "Professional trait description"}
                              </p>
                              <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
                                <strong>Example:</strong> {traitDescriptions[trait as keyof typeof traitDescriptions]?.example || "Example usage"}
                              </div>
                            </div>
                          ))}
                          
                          {customTraits.map((trait) => (
                            <div key={trait} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-blue-900">✓ {trait} (custom)</h4>
                                <button 
                                  onClick={() => removeCustom(trait)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                  type="button"
                                >
                                  Remove
                                </button>
                              </div>
                              <p className="text-sm text-blue-700">
                                Custom trait - you define what this means for your brand voice.
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <Button type="submit" className="w-full sm:w-auto">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin hidden" />
                    Generate Style Guide
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 