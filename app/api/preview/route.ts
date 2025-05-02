import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { generateBrandVoiceTraits } from '@/lib/openai'
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

// Process preview content with brand details and voice traits
async function processPreview(content: string, brandDetails: any): Promise<string> {
  try {
    Logger.info('Processing preview', { brand: brandDetails.name })
    
    // Replace basic placeholders
    let preview = content
      .replace(/{{DD MONTH YYYY}}/g, formatDate())
      .replace(/{{brand_name}}/g, brandDetails.name)
      .replace(
        /{{brand_contact_email}}/g,
        `support@${brandDetails.name.toLowerCase().replace(/\s+/g, '')}.com`
      )

    // Generate voice traits
    Logger.info('Generating voice traits')
    const voiceTraitsResult = await generateBrandVoiceTraits(brandDetails)
    
    if (!voiceTraitsResult.success) {
      Logger.error('Voice trait generation failed', new Error(voiceTraitsResult.error))
      throw new Error(`Failed to generate voice traits: ${voiceTraitsResult.error}`)
    }

    // Add type guard for content
    if (!voiceTraitsResult.content) {
      Logger.error('Voice traits content is missing')
      throw new Error('Voice traits content is missing')
    }

    Logger.debug('Voice traits generated', { content: voiceTraitsResult.content })

    // Extract and format voice traits with type safety
    const traits = voiceTraitsResult.content
      .split(/(?=###\s)/g)
      .filter(trait => trait.trim())
      .slice(0, 2) // Get first two traits for preview

    if (traits.length === 0) {
      Logger.error('No valid voice traits found in content')
      throw new Error('No valid voice traits found in content')
    }

    Logger.debug('Extracted traits', { count: traits.length, traits })

    // Format each trait to ensure consistent structure
    const formattedTraits = traits.map(trait => {
      const lines = trait.split('\n')
      const title = lines[0].replace('###', '').trim()
      const description = lines.slice(1).join('\n').trim()
      
      if (!title || !description) {
        const error = new Error('Invalid trait format - missing title or description')
        Logger.error('Invalid trait format detected', error, { trait })
        throw error
      }
      
      return `### ${title}\n${description}`
    })

    Logger.debug('Formatted traits', { traits: formattedTraits })

    // Replace voice trait placeholders
    formattedTraits.forEach((trait, index) => {
      const placeholder = `{{voice_trait_${index + 1}}}`
      Logger.debug(`Replacing trait ${index + 1}`, { placeholder })
      preview = preview.replace(new RegExp(placeholder, 'g'), trait)
    })

    // Remove any remaining template variables and clean up
    preview = cleanMarkdown(preview.replace(/{{.*?}}/g, ''))
    Logger.debug('Final preview', { length: preview.length })

    return preview
  } catch (error) {
    Logger.error('Preview processing failed', error instanceof Error ? error : new Error('Unknown error'))
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

    Logger.info('Preview generation request received', { brand: brandDetails?.name })

    // Clear template cache to force refresh
    clearTemplateCache()

    // Validate input
    if (!brandDetails?.name || !brandDetails?.description || !brandDetails?.audience) {
      Logger.warn('Invalid request - missing required fields')
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required brand details (name, description, audience)'
        },
        { status: 400 }
      )
    }

    // Load template preview (using core template for previews)
    const templateContent = await loadTemplatePreview('core_template_preview')

    // Process preview with brand details
    const processedPreview = await processPreview(templateContent, brandDetails)

    Logger.info('Preview generation successful', { brand: brandDetails.name })
    return NextResponse.json({ 
      preview: processedPreview,
      success: true
    })
  } catch (error) {
    Logger.error('Preview generation failed', error instanceof Error ? error : new Error('Unknown error'))
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