"use client"

import { useState, useEffect } from "react"
import { TRAITS } from "@/lib/traits"
import TraitCard from "./TraitCard"

const traitNames = Object.keys(TRAITS) as (keyof typeof TRAITS)[]

export default function VoiceTraitSelector({ onChange }: { onChange?: (traits: string[]) => void }) {
  const [selectedTraits, setSelectedTraits] = useState<string[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('selectedTraits')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length <= 3) {
          const validTraits = parsed.filter(t => traitNames.includes(t))
          setSelectedTraits(validTraits)
        }
      }
    } catch (error) {
      console.error('Error loading traits from localStorage:', error)
    }
  }, [])

  // Save to localStorage when traits change
  useEffect(() => {
    try {
      localStorage.setItem('selectedTraits', JSON.stringify(selectedTraits))
      onChange?.(selectedTraits)
    } catch (error) {
      console.error('Error saving traits to localStorage:', error)
    }
  }, [selectedTraits, onChange])

  const toggleTrait = (name: string) => {
    let updated: string[]
    if (selectedTraits.includes(name)) {
      updated = selectedTraits.filter((t) => t !== name)
    } else if (selectedTraits.length < 3) {
      updated = [name, ...selectedTraits]
    } else {
      return // max 3
    }
    setSelectedTraits(updated)
  }

  const traitDisabled = (name: string) => selectedTraits.length >= 3 && !selectedTraits.includes(name)

  return (
    <div className="space-y-6">
      {/* Trait pills */}
      <div className="grid grid-cols-3 gap-2">
        {traitNames.map((name) => (
          <button
            key={name}
            onClick={() => toggleTrait(name)}
            disabled={traitDisabled(name)}
            type="button"
            className={`rounded-full px-4 py-2 text-sm border transition-colors focus:outline-none ${
              selectedTraits.includes(name)
                ? "bg-black text-white border-black"
                : traitDisabled(name)
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Live rule panel */}
      {selectedTraits.map((name) => (
        <TraitCard key={name} traitName={name as keyof typeof TRAITS} />
      ))}
    </div>
  )
} 