import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import Logger from '@/lib/logger'

// Cache for templates
const templateCache: Record<string, string> = {}

// Format date as DD Month YYYY
function formatDate(): string {
  const now = new Date()
  Logger.debug('Formatting date', { date: now.toISOString() })
  const day = now.getDate().toString().padStart(2, '0')
  const month = now.toLocaleString('default', { month: 'long' })
  const year = now.getFullYear()
  const formatted = `${day} ${month} ${year}`
  Logger.debug('Formatted date', { formatted })
  return formatted
}

// Inline brand name extraction function (same as in brand-details form)
function extractBrandNameInline(brandDetailsText: string) {
  try {
    // Simple extraction logic - look for common patterns
    const text = brandDetailsText.trim()
    
    // Look for patterns like "Nike is a..." or "Apple creates..." - updated to handle ® symbols
    const patterns = [
      /^([A-Z][a-zA-Z0-9\s&®™©-]{1,30}?)\s+(?:is|are|was|were|creates?|makes?|provides?|offers?|specializes?)/i,
      /^([A-Z][a-zA-Z0-9\s&®™©-]{1,30}?)\s+(?:helps?|serves?|works?|focuses?)/i,
      /(?:company|brand|business|startup|organization)\s+(?:called|named)\s+([A-Z][a-zA-Z0-9\s&®™©-]{1,30})/i,
      /^([A-Z][a-zA-Z0-9\s&®™©-]{1,30}?)\s*[,.]?\s*(?:a|an|the)/i
    ]
    
    // Try each pattern
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        let brandName = match[1].trim()
        // Clean up trailing punctuation and symbols
        brandName = brandName.replace(/[®™©]*$/, '').trim()
        // Validate it's not too generic
        const genericWords = ['company', 'business', 'brand', 'startup', 'organization', 'team', 'we', 'our', 'this', 'that']
        if (!genericWords.includes(brandName.toLowerCase()) && brandName.length > 1) {
          return { success: true, brandName }
        }
      }
    }
    
    // Fallback: look for first capitalized word that's not too common
    const words = text.split(/\s+/)
    for (const word of words) {
      if (/^[A-Z][a-zA-Z0-9&®™©-]{1,20}$/.test(word)) {
        const cleanWord = word.replace(/[®™©]*$/, '').trim()
        const commonWords = ['The', 'This', 'That', 'Our', 'We', 'Company', 'Business', 'Brand', 'Team']
        if (!commonWords.includes(cleanWord)) {
          return { success: true, brandName: cleanWord }
        }
      }
    }
    
    // Final fallback
    return { success: true, brandName: "Your Brand" }
  } catch (error) {
    console.error("Brand name extraction failed:", error)
    return { success: true, brandName: "Your Brand" }
  }
}

// Generic voice traits for static preview
const GENERIC_VOICE_TRAIT_1 = `### 1. Clear & Concise

***What It Means***

→ Use simple, direct language that anyone can understand.
→ Break down complex ideas into easy steps.
→ Keep sentences short and to the point.

***What It Doesn't Mean***

✗ Leaving out important details for the sake of brevity.
✗ Using jargon or technical terms without explanation.
✗ Oversimplifying topics that need nuance.`

const GENERIC_VOICE_TRAIT_2 = `### 2. Friendly & Approachable

***What It Means***

→ Write as if you're talking to a real person.
→ Use a warm, welcoming tone in every message.
→ Encourage questions and feedback.

***What It Doesn't Mean***

✗ Being overly casual or unprofessional.
✗ Using slang that not everyone will understand.
✗ Ignoring the needs or concerns of your audience.`

// Clean up markdown content
function cleanMarkdown(content: string): string {
  return content
    .replace(/(?<!\n)#(?!\s)/g, '') // Remove standalone # not at start of line
    .replace(/(?<=\n)#(?!\s|#)/g, '') // Remove # at start of line if not followed by space or #
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double
    .replace(/\s+$/gm, '') // Remove trailing whitespace
    .replace(/^(#+)\s*(?=\S)/gm, '$1 ') // Add space after # if missing
    .replace(/^#+\s*#+\s*/gm, '## ') // Fix duplicate heading markers
    .trim()
}

// Load and process template for preview
async function loadTemplatePreview(templateName: string): Promise<string> {
  try {
    Logger.debug('Loading template', { name: templateName })
    
    // Check cache first
    if (templateCache[templateName]) {
      Logger.debug('Using cached template')
      return templateCache[templateName]
    }

    const templatePath = path.join(process.cwd(), 'templates', `${templateName}.md`)
    const template = await fs.promises.readFile(templatePath, 'utf-8')
    Logger.debug('Template loaded', { length: template.length })
    
    // Split template into sections and preserve heading levels
    const sections = template.split(/(?=^#{1,2}\s)/gm)
    Logger.debug('Template sections', { count: sections.length })
    
    // Find index of Brand Voice section
    const brandVoiceIndex = sections.findIndex(section => 
      section.trim().startsWith('## Brand Voice')
    )
    
    if (brandVoiceIndex === -1) {
      throw new Error('Brand Voice section not found in template')
    }
    
    // Get content up to and including Brand Voice section
    const previewSections = sections.slice(0, brandVoiceIndex + 1)
    
    // Join sections and clean up formatting
    const preview = cleanMarkdown(previewSections.join('\n\n'))
    Logger.debug('Preview generated', { length: preview.length })
    
    // Cache the result
    templateCache[templateName] = preview
    
    return preview
  } catch (error) {
    Logger.error('Template preview generation failed', error instanceof Error ? error : new Error('Unknown error'))
    throw new Error(`Failed to load template preview: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Process preview content with brand details (static - no AI calls)
async function processPreview(content: string, brandDetails: any): Promise<string> {
  try {
    Logger.info('Processing static preview', { brand: brandDetails.name })
    
    // Replace basic placeholders
    let preview = content
      .replace(/{{DD MONTH YYYY}}/g, formatDate())
      .replace(/{{brand_name}}/g, brandDetails.name)
      .replace(
        /{{brand_contact_email}}/g,
        `support@${brandDetails.name.toLowerCase().replace(/\s+/g, '')}.com`
      )

    // Use static generic voice traits instead of AI-generated ones
    Logger.info('Using static voice traits for preview')
    
    // Replace voice trait placeholders with generic content
    preview = preview.replace(/{{voice_trait_1}}/g, GENERIC_VOICE_TRAIT_1)
    preview = preview.replace(/{{voice_trait_2}}/g, GENERIC_VOICE_TRAIT_2)

    // Remove any remaining template variables and clean up
    preview = cleanMarkdown(preview.replace(/{{.*?}}/g, ''))
    Logger.debug('Final static preview', { length: preview.length })

    return preview
  } catch (error) {
    Logger.error('Static preview processing failed', error instanceof Error ? error : new Error('Unknown error'))
    throw error
  }
}

// Clear template cache
function clearTemplateCache() {
  Object.keys(templateCache).forEach(key => delete templateCache[key])
  Logger.debug('Template cache cleared')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { brandDetails } = body

    Logger.info('Static preview generation request received', { brand: brandDetails?.brandDetailsText })

    // Clear template cache to force refresh
    clearTemplateCache()

    // Validate input
    if (!brandDetails?.brandDetailsText) {
      Logger.warn('Invalid request - missing required fields')
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required brand details (brandDetailsText)'
        },
        { status: 400 }
      )
    }

    // Extract brand name using inline function (no AI call)
    const nameResult = extractBrandNameInline(brandDetails.brandDetailsText)
    let brandName = "Your Brand"
    if (nameResult.success && nameResult.brandName) {
      brandName = nameResult.brandName
    }

    // Create processed brand details for template processing
    const processedBrandDetails = {
      ...brandDetails,
      name: brandName,
      description: brandDetails.brandDetailsText,
      audience: '',
    }

    // Load template preview (using core template for previews)
    const templateContent = await loadTemplatePreview('core_template_preview')

    // Process preview with brand details (static - no AI)
    const processedPreview = await processPreview(templateContent, processedBrandDetails)

    Logger.info('Static preview generation successful', { brand: processedBrandDetails.name })
    return NextResponse.json({ 
      preview: processedPreview,
      success: true
    })
  } catch (error) {
    Logger.error('Static preview generation failed', error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 