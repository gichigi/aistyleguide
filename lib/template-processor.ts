import { generateBrandVoiceTraits, generateWithOpenAI, generateFullCoreStyleGuide, generateCompleteStyleGuide } from "./openai"
import { marked } from 'marked'

// Function to load a template file via API
export async function loadTemplate(templateName: string): Promise<string> {
  console.log(`[loadTemplate] Called with templateName: "${templateName}"`)
  
  try {
    // Use absolute URL with origin for server-side calls
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL
    
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set')
    }
    
    console.log(`[loadTemplate] Base URL: "${baseUrl}"`)
    console.log(`[loadTemplate] Environment: ${typeof window !== 'undefined' ? 'client-side' : 'server-side'}`)
    
    const fullUrl = `${baseUrl}/api/load-template?name=${templateName}`
    console.log(`[loadTemplate] Fetching from: "${fullUrl}"`)
    
    const response = await fetch(fullUrl)
    console.log(`[loadTemplate] Response status: ${response.status}`)
    
    const data = await response.json()
    console.log(`[loadTemplate] Response data:`, {
      hasContent: !!data.content,
      contentLength: data.content?.length || 0,
      error: data.error || 'none'
    })

    if (!response.ok) {
      console.error(`[loadTemplate] API error:`, data)
      throw new Error(data.error || `Failed to load template: ${templateName}`)
    }

    console.log(`[loadTemplate] Successfully loaded template "${templateName}" (${data.content.length} chars)`)
    return data.content
  } catch (error) {
    console.error(`[loadTemplate] Error loading template ${templateName}:`, error)
    throw new Error(`Failed to load template: ${templateName}`)
  }
}

// Function to format markdown content for consistent display
function formatMarkdownContent(content: string | undefined): string {
  if (!content) {
    console.warn('Empty content passed to formatMarkdownContent')
    return ''
  }

  // Step 0: Fix main title to 'Apple Style Rules' (H1)
  let formatted = content.replace(/^#\s*.*Style Guide.*$/im, '# Apple Style Rules');

  // Step 1: Clean up basic whitespace
  let formatted2 = formatted
    .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newlines
    .replace(/\s+$/gm, "") // Remove trailing whitespace
    .replace(/^\s+/gm, "") // Remove leading whitespace
    .trim()

  // Step 1.5: Convert section headers like '1. Spelling Conventions' to H2
  formatted2 = formatted2.replace(/^(\d+\.?\s+[^\n]+)$/gm, '## $1');

  // Step 1.6: Convert rule names (e.g. 'Company Name Spelling') to bold paragraph text, not headings
  formatted2 = formatted2.replace(/^\*\*([^*\n]+)\*\*\s*$/gm, '<strong>$1</strong>');
  // Remove any leftover H3/H4 for rule names
  //formatted2 = formatted2.replace(/^#{3,4}\s*([^\n]+)$/gm, '<strong>$1</strong>');

  // Step 1.7: Prevent line breaks for dashes, slashes, and quotes within lines
  formatted2 = formatted2.replace(/([\w\d])\s*([\-\/"'])\s*([\w\d])/g, '$1$2$3');

  // Step 2: Standardize trait headings to H3
  // Convert bold trait names to H3
  formatted2 = formatted2.replace(/^\*\*([^*\n]+)\*\*(?!\n#)/gm, '### $1')
  // Convert ## or #### trait names to H3
  formatted2 = formatted2.replace(/^#{2,}\s*([^\n]+)$/gm, '### $1')
  // Convert plain trait names at the start of a block to H3 (followed by What It Means/Doesn't Mean or a description)
  formatted2 = formatted2.replace(/^([A-Z][a-zA-Z ]{2,30})\n(?=(What It Means|What It Doesn\'t Mean|[A-Z][a-z]+))/gm, '### $1\n')
  
  // Step 3: Convert "What It Means" and "What It Doesn't Mean" to H4 with double spacing above
  formatted2 = formatted2.replace(/^(?:\*\*\*?|__)?(What It (?:Doesn't )?Means?)(?:\*\*\*?|__)?/gm, '\n\n#### $1');
  // Remove any extra blank lines that may result
  formatted2 = formatted2.replace(/\n{3,}/g, '\n\n');
  
  // Step 4: Fix spacing for headings
  formatted2 = formatted2
    // Add newline after headings if not present
    .replace(/^(#{1,6}\s[^\n]+)(?!\n)/gm, '$1\n')
    // Ensure exactly one blank line before headings (except at start)
    .replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2')

  // Step 5: Number the 25 core rules
  // Find the section with core rules
  let ruleCount = 0;
  let inRulesSection = false;
  const lines = formatted2.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect start of core rules section
    if (line.includes('Core Rules') || line.includes('core rules')) {
      inRulesSection = true;
      newLines.push(line);
      continue;
    }
    
    // Check for H3 rule headers when in the core rules section
    if (inRulesSection && line.match(/^###\s+([A-Z][a-z]+)$/)) {
      ruleCount++;
      // Replace H3 header with numbered H3 header
      newLines.push(`### ${ruleCount}. ${line.substring(4).trim()}`);
    } else {
      newLines.push(line);
    }
  }
  
  formatted2 = newLines.join('\n');

  // Step 6: Fix spacing for Right/Wrong examples
  formatted2 = formatted2
    // Normalize spacing after ✅ and ❌
    .replace(/(✅|❌)\s*([Rr]ight|[Ww]rong):\s*/g, '$1 $2: ')
    // Add newline after each example if not present
    .replace(/(✅[^\n]+|❌[^\n]+)(?!\n)/g, '$1\n')
    // Ensure examples are grouped together with single line spacing
    .replace(/(✅[^\n]+)\n\n(❌)/g, '$1\n$2')

  // Step 7: Fix spacing for lists and arrows
  formatted2 = formatted2
    // Normalize arrow spacing
    .replace(/^→\s*/gm, '→ ')
    // Normalize x mark spacing
    .replace(/^✗\s*/gm, '✗ ')
    // Add newline after list items if not present
    .replace(/^([-→✗]\s[^\n]+)(?!\n)/gm, '$1\n')

  // Step 8: Fix punctuation issues - prevent quotes/periods from breaking to new lines
  formatted2 = formatted2
    // Fix dangling quotes and punctuation
    .replace(/(\w+)\s+([,.!?:;"])(\s*\n)/g, '$1$2$3')
    // Ensure there's no space before periods/commas
    .replace(/\s+([,.!?:;"])/g, '$1')
    // Fix word breaking with non-breaking space for single character endings
    .replace(/(\w+)(\s*\n\s*)([a-z])(\s*\n)/g, '$1$3$4')

  // Step 9: Fix section spacing
  formatted2 = formatted2
    // Ensure sections are separated by exactly one blank line
    .replace(/\n{3,}/g, '\n\n')
    // Extra spacing before/after What It Means/Doesn't Mean sections
    .replace(/(####\s+What It (?:Doesn't )?Means?)\n/g, '$1\n\n')

  // Step 10: Ensure space after colon
  formatted2 = formatted2.replace(/:(\S)/g, ': $1')

  return formatted2;
}

// Function to validate markdown content
function validateMarkdownContent(content: string | undefined): boolean {
  if (!content || typeof content !== 'string') {
    console.warn('Invalid content passed to validateMarkdownContent')
    return false
  }

  // Clean the content first
  const cleanedContent = content
    .replace(/```markdown\n?/g, '') // Remove markdown code block markers
    .replace(/```\n?/g, '') // Remove any remaining code block markers
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double

  // Check for basic markdown structure
  const hasHeaders = /^#{1,6}\s.+/m.test(cleanedContent)
  const hasFormatting = /[*_`]/.test(cleanedContent)
  
  if (!hasHeaders) {
    console.warn('Content missing required markdown header')
    return false
  }
  
  // For voice traits, check for trait structure
  if (cleanedContent.toLowerCase().includes('trait')) {
    const hasTraitSections = (
      cleanedContent.includes("What It Means") || 
      cleanedContent.includes("Description") ||
      cleanedContent.includes("What It Doesn't Mean") ||
      cleanedContent.includes("Guidelines") ||
      cleanedContent.includes("Avoid")
    )
    if (!hasTraitSections) {
      console.warn('Voice trait content missing required sections')
    }
    return hasHeaders && hasTraitSections
  }
  
  // For rules, check for example structure
  if (cleanedContent.toLowerCase().includes('rule')) {
    // Accept any of these as valid right/wrong lines:
    // - **Right**: ...
    // - **Wrong**: ...
    // ✅ Right: ...
    // ❌ Wrong: ...
    // Right: ...
    // Wrong: ...
    const hasRight = cleanedContent.match(/(^|\n)(-\s*)?(\*\*|✅)?\s*Right:?/)
    const hasWrong = cleanedContent.match(/(^|\n)(-\s*)?(\*\*|❌)?\s*Wrong:?/)
    const hasRuleHeader = cleanedContent.match(/^###\s.+/m)
    if (!hasRight || !hasWrong || !hasRuleHeader) {
      console.warn('Rule content missing required right/wrong structure')
      return false
    }
    return true
  }
  
  // If neither traits nor rules, just check for basic markdown
  return hasHeaders && hasFormatting
}

// Add validation function
function validateBrandDetails(details: any) {
  const errors: string[] = []
  
  // Name validation
  if (!details.name || details.name.trim().length === 0) {
    errors.push("Brand name is required")
  } else if (details.name.length > 50) {
    errors.push("Brand name must be 50 characters or less")
  }
  
  // Description validation
  if (!details.description || details.description.trim().length === 0) {
    errors.push("Brand description is required")
  } else if (details.description.length > 500) {
    errors.push("Brand description must be 500 characters or less")
  }
  
  // Audience validation
  if (!details.audience || details.audience.trim().length === 0) {
    errors.push("Target audience is required")
  } else if (details.audience.length > 500) {
    errors.push("Target audience must be 500 characters or less")
  }
  
  // Tone validation
  const validTones = ["friendly", "professional", "casual", "formal", "technical"]
  if (!details.tone || !validTones.includes(details.tone)) {
    errors.push("Invalid tone selected")
  }
  
  return errors
}

// Function to convert markdown to HTML
async function markdownToHtml(markdown: string): Promise<string> {
  return marked(markdown, {
    gfm: true,
    breaks: true
  })
}

// Main function to process a template with brand details
export async function processTemplate(templateType: string, brandDetails: any, plan: string): Promise<string> {
  try {
    console.log("Processing template:", templateType, "with plan:", plan)
    console.log("Brand details:", brandDetails)

    // Validate brand details
    const validationErrors = validateBrandDetails(brandDetails)
    if (validationErrors.length > 0) {
      throw new Error(`Invalid brand details: ${validationErrors.join(", ")}`)
    }

    // Validate and set defaults for brand details - only essential fields
    const validatedDetails = {
      name: brandDetails.name.trim(),
      description: brandDetails.description.trim(),
      audience: brandDetails.audience.trim(),
      tone: brandDetails.tone,
    }

    // Check for required fields
    if (!validatedDetails.name || !validatedDetails.description) {
      throw new Error("Brand name and description are required")
    }

    console.log("Validated details:", validatedDetails)

    // Determine which template to use
    let templateName: string
    if (plan === "complete") {
      templateName = "complete_template"
    } else {
      templateName = "core_template"
    }

    console.log("Using template:", templateName)

    // Load the template
    let template = await loadTemplate(templateName)
    console.log("Template loaded, length:", template.length)

    // Replace basic placeholders
    template = template.replace(/{{DD MONTH YYYY}}/g, formatDate())
    template = template.replace(/{{brand_name}}/g, validatedDetails.name)
    template = template.replace(
      /{{brand_contact_email}}/g,
      `support@${validatedDetails.name.toLowerCase().replace(/\s+/g, "")}.com`,
    )

    console.log("Basic placeholders replaced")

    // Generate brand voice traits for both core and complete plans
    try {
      const brandVoiceResult = await generateBrandVoiceTraits(validatedDetails);
      if (brandVoiceResult.success && brandVoiceResult.content) {
        // Split traits if possible
        const traits = brandVoiceResult.content.split(/(?=### )/g).map(t => t.trim()).filter(Boolean);
        template = template.replace(/{{voice_trait_1}}/g, traits[0] || '');
        template = template.replace(/{{voice_trait_2}}/g, traits[1] || '');
        template = template.replace(/{{voice_trait_3}}/g, traits[2] || '');
        // Remove any leftover placeholders
        template = template.replace(/{{voice_trait_\d}}/g, '');
      } else {
        template = template.replace(/{{voice_trait_1}}/g, '_Could not generate brand voice trait 1._');
        template = template.replace(/{{voice_trait_2}}/g, '_Could not generate brand voice trait 2._');
        template = template.replace(/{{voice_trait_3}}/g, '_Could not generate brand voice trait 3._');
      }
    } catch (error) {
      console.error("Error generating brand voice traits:", error)
      template = template.replace(/{{voice_trait_1}}/g, '_Could not generate brand voice trait 1._');
      template = template.replace(/{{voice_trait_2}}/g, '_Could not generate brand voice trait 2._');
      template = template.replace(/{{voice_trait_3}}/g, '_Could not generate brand voice trait 3._');
    }

    console.log("Voice trait placeholders replaced")

    // Generate all rules at once for the complete plan
    if (plan === "complete") {
      try {
        const completeRulesResult = await generateCompleteStyleGuide(validatedDetails);
        if (completeRulesResult.success && completeRulesResult.content) {
          // Replace {{complete_rules}} with the generated rules
          template = template.replace(/{{complete_rules}}/g, formatMarkdownContent(completeRulesResult.content));
        } else {
          template = template.replace(/{{complete_rules}}/g, '_Could not generate complete rules for this brand._');
        }
      } catch (error) {
        console.error("Error generating complete style guide rules:", error);
        template = template.replace(/{{complete_rules}}/g, '_Could not generate complete rules for this brand._');
      }
    } else {
      // Generate all 25 rules at once and insert into template (core)
      try {
        const coreRulesResult = await generateFullCoreStyleGuide(validatedDetails);
        if (coreRulesResult.success && coreRulesResult.content) {
          template = template.replace(/{{core_rules}}/g, formatMarkdownContent(coreRulesResult.content));
        } else {
          template = template.replace(/{{core_rules}}/g, "_Could not generate core rules for this brand._");
        }
      } catch (error) {
        console.error("Error generating full core style guide rules:", error);
        template = template.replace(/{{core_rules}}/g, "_Could not generate core rules for this brand._");
      }
    }

    // Generate examples if needed for complete template
    if (plan === "complete") {
      try {
        const examplePrompt = `Create example content for the ${validatedDetails.name} brand with a ${validatedDetails.tone} tone.
        The brand description is: ${validatedDetails.description}
        Target audience: ${validatedDetails.audience}
        
        Generate in markdown format:
        1. A blog post example (2-3 paragraphs)
        2. A LinkedIn post example (1 paragraph)
        3. An email newsletter example (2-3 paragraphs)
        
        Each example should demonstrate the brand voice traits and follow the style guide rules.`

        const exampleResult = await generateWithOpenAI(
          examplePrompt,
          "You are an expert copywriter who understands brand voice and content strategy.",
          "markdown"
        )
        if (!exampleResult.success) {
          throw new Error(`Failed to generate examples: ${exampleResult.error}`)
        }

        if (!exampleResult.content) {
          throw new Error("Example content is missing")
        }

        const content = exampleResult.content
        if (!validateMarkdownContent(content)) {
          throw new Error("Generated examples do not match required markdown format")
        }

        // Replace example placeholders
        const formattedContent = formatMarkdownContent(content)
        if (!formattedContent) {
          throw new Error("Failed to format example content")
        }
        template = template.replace(/{{example_content}}/g, formattedContent)
      } catch (error) {
        console.error("Error generating examples:", error)
        throw new Error(`Example generation failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    console.log("All placeholders replaced, template ready")

    // Final formatting pass to ensure consistent markdown
    const formattedMarkdown = formatMarkdownContent(template)
    return await markdownToHtml(formattedMarkdown)
  } catch (error) {
    console.error("Error processing template:", error)
    throw error
  }
}

// Helper function to format the current date
function formatDate(): string {
  const date = new Date()
  const day = date.getDate()
  const month = date.toLocaleString("default", { month: "long" })
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

// Generic content for preview
const GENERIC_VOICE_TRAIT_1 = `**Clear & Concise**

What It Means
→ Use simple, direct language that anyone can understand.
→ Break down complex ideas into easy steps.
→ Keep sentences short and to the point.

What It Doesn't Mean
✗ Leaving out important details for the sake of brevity.
✗ Using jargon or technical terms without explanation.
✗ Oversimplifying topics that need nuance.`;

const GENERIC_VOICE_TRAIT_2 = `**Friendly & Approachable**

What It Means
→ Write as if you're talking to a real person.
→ Use a warm, welcoming tone in every message.
→ Encourage questions and feedback.

What It Doesn't Mean
✗ Being overly casual or unprofessional.
✗ Using slang that not everyone will understand.
✗ Ignoring the needs or concerns of your audience.`;

// Function to generate a preview of the core template
export async function generateTemplatePreview(brandDetails: any): Promise<string> {
  try {
    // Load preview template
    const template = await loadTemplate('core_template_preview');
    
    // Format current date
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Replace basic variables
    const preview = template
      .replace(/{{DD MONTH YYYY}}/g, formattedDate)
      .replace(/{{brand_name}}/g, brandDetails.name || 'Your Brand')
      .replace(/{{voice_trait_1}}/g, GENERIC_VOICE_TRAIT_1)
      .replace(/{{voice_trait_2}}/g, GENERIC_VOICE_TRAIT_2)
      .replace(/{{rule_line}}/g, brandDetails.ruleLine || '');
    
    return await markdownToHtml(preview);
  } catch (error) {
    console.error('Preview generation failed:', error);
    throw new Error(`Preview generation failed: ${error}`);
  }
}

// Shared function to render style guide template
export async function renderStyleGuideTemplate({
  brandDetails,
  useAIContent = false,
  templateType = "preview"
}: {
  brandDetails: any,
  useAIContent?: boolean,
  templateType?: "preview" | "core" | "complete"
}): Promise<string> {
  console.log(`[renderStyleGuideTemplate] Called with:`, {
    useAIContent,
    templateType,
    hasBrandDetails: !!brandDetails,
    brandName: brandDetails?.name || 'not set'
  })
  
  // Pick template name
  let templateName = "core_template_preview";
  if (templateType === "core") templateName = "core_template";
  if (templateType === "complete") templateName = "complete_template";
  
  console.log(`[renderStyleGuideTemplate] Selected template: "${templateName}"`)

  // Load template
  console.log(`[renderStyleGuideTemplate] Loading template...`)
  const template = await loadTemplate(templateName);
  console.log(`[renderStyleGuideTemplate] Template loaded successfully (${template.length} chars)`)

  // Format date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Extract brand name if using AI content and we have brandDetailsText
  let brandName = brandDetails.name || 'Your Brand';
  // Brand name should now always be provided by the frontend

  // Replace basic placeholders
  let result = template
    .replace(/{{DD MONTH YYYY}}/g, formattedDate)
    .replace(/{{brand_name}}/g, brandName);
    
  console.log(`[renderStyleGuideTemplate] Basic placeholders replaced`)

  // Fill in brand_voice_traits and core_rules/complete_rules
  if (useAIContent) {
    console.log(`[renderStyleGuideTemplate] Generating AI content...`)
    // AI-generated content (like processTemplate)
    try {
      const validatedDetails = {
        name: brandName,
        description: brandDetails.description?.trim() || brandDetails.brandDetailsText || '',
        audience: brandDetails.audience?.trim() || '',
        tone: brandDetails.tone || '',
      };
      // Brand voice traits
      const brandVoiceResult = await generateBrandVoiceTraits(validatedDetails);
      if (brandVoiceResult.success && brandVoiceResult.content) {
        result = result.replace(/{{brand_voice_traits}}/g, formatMarkdownContent(brandVoiceResult.content));
      } else {
        result = result.replace(/{{brand_voice_traits}}/g, "_Could not generate brand voice traits for this brand._");
      }
      if (templateType === "complete") {
        // Complete rules
        const completeRulesResult = await generateCompleteStyleGuide(validatedDetails);
        if (completeRulesResult.success && completeRulesResult.content) {
          result = result.replace(/{{complete_rules}}/g, formatMarkdownContent(completeRulesResult.content));
        } else {
          result = result.replace(/{{complete_rules}}/g, "_Could not generate complete rules for this brand._");
        }
      } else {
        // Core rules
        const coreRulesResult = await generateFullCoreStyleGuide(validatedDetails);
        if (coreRulesResult.success && coreRulesResult.content) {
          result = result.replace(/{{core_rules}}/g, formatMarkdownContent(coreRulesResult.content));
        } else {
          result = result.replace(/{{core_rules}}/g, "_Could not generate core rules for this brand._");
        }
      }
    } catch (error) {
      result = result.replace(/{{brand_voice_traits}}/g, "_Could not generate brand voice traits for this brand._");
      result = result.replace(/{{core_rules}}/g, "_Could not generate core rules for this brand._");
      result = result.replace(/{{complete_rules}}/g, "_Could not generate complete rules for this brand._");
    }
  } else {
    // Generic content (like generateTemplatePreview)
    result = result
      .replace(/{{brand_voice_traits}}/g, `${GENERIC_VOICE_TRAIT_1}\n\n${GENERIC_VOICE_TRAIT_2}`)
      .replace(/{{core_rules}}/g, brandDetails.ruleLine || '')
      .replace(/{{voice_trait_1}}/g, GENERIC_VOICE_TRAIT_1)
      .replace(/{{voice_trait_2}}/g, GENERIC_VOICE_TRAIT_2)
      .replace(/{{rule_line}}/g, brandDetails.ruleLine || '');
  }

  // Convert to HTML
  if (templateType === "preview") {
    // Remove 'General Guidelines' section for preview only
    result = result.replace(/## General Guidelines[\s\S]*?(?=\n## |$)/, '');
  }
  return await markdownToHtml(result);
}