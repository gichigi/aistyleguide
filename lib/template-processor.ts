import { generateBrandVoiceTraits, generateWithOpenAI, generateFullCoreStyleGuide } from "./openai"
import { marked } from 'marked'

// Function to load a template file via API
export async function loadTemplate(templateName: string): Promise<string> {
  try {
    // Use absolute URL with origin for server-side calls
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/load-template?name=${templateName}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `Failed to load template: ${templateName}`)
    }

    return data.content
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error)
    throw new Error(`Failed to load template: ${templateName}`)
  }
}

// Function to format markdown content for consistent display
function formatMarkdownContent(content: string | undefined): string {
  if (!content) {
    console.warn('Empty content passed to formatMarkdownContent')
    return ''
  }

  // Step 1: Clean up basic whitespace
  let formatted = content
    .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newlines
    .replace(/\s+$/gm, "") // Remove trailing whitespace
    .replace(/^\s+/gm, "") // Remove leading whitespace
    .trim()

  // Step 2: Ensure brand voice traits have H3 headers
  // Look for bold trait names that aren't already headers
  formatted = formatted.replace(/^(\*\*([^*\n]+)\*\*)(?!\n#)/gm, '### $2')
  
  // Step 3: Convert "What It Means" and "What It Doesn't Mean" to H4 with proper spacing
  formatted = formatted
    .replace(/^(?:\*\*)?(What It (?:Doesn't )?Means?)(?:\*\*)?/gm, '#### $1')
    .replace(/(####\s+What It (?:Doesn't )?Means?)/g, '\n$1\n')
  
  // Step 4: Fix spacing for headings
  formatted = formatted
    // Add newline after headings if not present
    .replace(/^(#{1,6}\s[^\n]+)(?!\n)/gm, '$1\n')
    // Ensure exactly one blank line before headings (except at start)
    .replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2')

  // Step 5: Number the 25 core rules
  // Find the section with core rules
  let ruleCount = 0;
  let inRulesSection = false;
  const lines = formatted.split('\n');
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
  
  formatted = newLines.join('\n');

  // Step 6: Fix spacing for Right/Wrong examples
  formatted = formatted
    // Normalize spacing after ✅ and ❌
    .replace(/(✅|❌)\s*([Rr]ight|[Ww]rong):\s*/g, '$1 $2: ')
    // Add newline after each example if not present
    .replace(/(✅[^\n]+|❌[^\n]+)(?!\n)/g, '$1\n')
    // Ensure examples are grouped together with single line spacing
    .replace(/(✅[^\n]+)\n\n(❌)/g, '$1\n$2')

  // Step 7: Fix spacing for lists and arrows
  formatted = formatted
    // Normalize arrow spacing
    .replace(/^→\s*/gm, '→ ')
    // Normalize x mark spacing
    .replace(/^✗\s*/gm, '✗ ')
    // Add newline after list items if not present
    .replace(/^([-→✗]\s[^\n]+)(?!\n)/gm, '$1\n')

  // Step 8: Fix punctuation issues - prevent quotes/periods from breaking to new lines
  formatted = formatted
    // Fix dangling quotes and punctuation
    .replace(/(\w+)\s+([,.!?:;"])(\s*\n)/g, '$1$2$3')
    // Ensure there's no space before periods/commas
    .replace(/\s+([,.!?:;"])/g, '$1')
    // Fix word breaking with non-breaking space for single character endings
    .replace(/(\w+)(\s*\n\s*)([a-z])(\s*\n)/g, '$1$3$4')

  // Step 9: Fix section spacing
  formatted = formatted
    // Ensure sections are separated by exactly one blank line
    .replace(/\n{3,}/g, '\n\n')
    // Extra spacing before/after What It Means/Doesn't Mean sections
    .replace(/(####\s+What It (?:Doesn't )?Means?)\n/g, '$1\n\n')

  return formatted;
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

    // Generate all brand voice traits at once and insert into template
    try {
      const brandVoiceResult = await generateBrandVoiceTraits(validatedDetails);
      if (brandVoiceResult.success && brandVoiceResult.content) {
        template = template.replace(/{{brand_voice_traits}}/g, formatMarkdownContent(brandVoiceResult.content));
      } else {
        template = template.replace(/{{brand_voice_traits}}/g, "_Could not generate brand voice traits for this brand._");
      }
    } catch (error) {
      console.error("Error generating brand voice traits:", error)
      template = template.replace(/{{brand_voice_traits}}/g, "_Could not generate brand voice traits for this brand._");
    }

    console.log("Voice trait placeholders replaced")

    // Generate all 25 rules at once and insert into template
    try {
      const coreRulesResult = await generateFullCoreStyleGuide(validatedDetails);
      if (coreRulesResult.success && coreRulesResult.content) {
        template = template.replace(/{{core_rules}}/g, formatMarkdownContent(coreRulesResult.content));
      } else {
        template = template.replace(/{{core_rules}}/g, "_Could not generate core rules for this brand._");
      }
    } catch (error) {
      console.error("Error generating full core style guide rules:", error)
      template = template.replace(/{{core_rules}}/g, "_Could not generate core rules for this brand._");
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
  // Pick template name
  let templateName = "core_template_preview";
  if (templateType === "core") templateName = "core_template";
  if (templateType === "complete") templateName = "complete_template";

  // Load template
  const template = await loadTemplate(templateName);

  // Format date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Replace basic placeholders
  let result = template
    .replace(/{{DD MONTH YYYY}}/g, formattedDate)
    .replace(/{{brand_name}}/g, brandDetails.name || 'Your Brand');

  // Fill in brand_voice_traits and core_rules
  if (useAIContent) {
    // AI-generated content (like processTemplate)
    try {
      const validatedDetails = {
        name: brandDetails.name?.trim() || '',
        description: brandDetails.description?.trim() || '',
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
      // Core rules
      const coreRulesResult = await generateFullCoreStyleGuide(validatedDetails);
      if (coreRulesResult.success && coreRulesResult.content) {
        result = result.replace(/{{core_rules}}/g, formatMarkdownContent(coreRulesResult.content));
      } else {
        result = result.replace(/{{core_rules}}/g, "_Could not generate core rules for this brand._");
      }
    } catch (error) {
      result = result.replace(/{{brand_voice_traits}}/g, "_Could not generate brand voice traits for this brand._");
      result = result.replace(/{{core_rules}}/g, "_Could not generate core rules for this brand._");
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
  return await markdownToHtml(result);
}