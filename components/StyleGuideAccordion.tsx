"use client"

import { useState, useEffect } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { parseStyleGuideContent, getDefaultOpenSections, type StyleGuideSection } from "@/lib/content-parser"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"

interface StyleGuideAccordionProps {
  content: string
  defaultOpenSections?: string[]
}

export function StyleGuideAccordion({ content, defaultOpenSections }: StyleGuideAccordionProps) {
  const [sections, setSections] = useState<StyleGuideSection[]>([])
  const [openSection, setOpenSection] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!content) return
    const parsedSections = parseStyleGuideContent(content)
    setSections(parsedSections)
    // Open the first accordion section by default (after the first two)
    if (parsedSections.length > 2) {
      setOpenSection(parsedSections[2].id)
    }
  }, [content])

  if (sections.length === 0) {
    // Fallback to original content if parsing fails
    return (
      <div className="w-full">
        <MarkdownRenderer content={content} className="prose-slate dark:prose-invert max-w-none style-guide-content" />
      </div>
    )
  }

  // First two sections always open, styled as prose
  const alwaysOpenSections = sections.slice(0, 2)
  const accordionSections = sections.slice(2)

  return (
    <div className="w-full">
      {alwaysOpenSections.map((section) => (
        <div key={section.id} className="mb-6">
          <MarkdownRenderer 
            content={`## ${section.title}\n\n${section.content}`} 
            className="prose-slate dark:prose-invert max-w-none style-guide-content prose-sm sm:prose-base" 
          />
        </div>
      ))}
      {accordionSections.length > 0 && (
        <Accordion type="single" collapsible className="w-full" value={openSection} onValueChange={setOpenSection}>
          {accordionSections.map((section) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger>
                {section.title}
              </AccordionTrigger>
              <AccordionContent>
                <MarkdownRenderer 
                  content={section.content} 
                  className="prose-slate dark:prose-invert max-w-none style-guide-content prose-sm sm:prose-base" 
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
} 