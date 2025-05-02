import { generateBrandVoiceTraits, generateWithOpenAI, generateStyleGuideRules } from "./openai"

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
  return content
    .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newlines
    .replace(/\s+$/gm, "") // Remove trailing whitespace
    .replace(/^\s+/gm, "") // Remove leading whitespace
    .trim()
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

    // Generate brand voice traits with OpenAI - enhanced with audience context
    try {
      console.log("Generating brand voice trait details with OpenAI")
      for (let i = 1; i <= 3; i++) {
        // Title
        const titlePrompt = `Give a short, catchy title for brand voice trait #${i} for ${validatedDetails.name}.`;
        const titleResult = await generateWithOpenAI(titlePrompt, "You are an expert brand strategist.", "markdown");
        template = template.replace(new RegExp(`{{voice_trait_${i}_title}}`, 'g'), formatMarkdownContent(titleResult.content || ''));

        // Description
        const descPrompt = `Write a 1-2 sentence description for brand voice trait #${i} for ${validatedDetails.name}.`;
        const descResult = await generateWithOpenAI(descPrompt, "You are an expert brand strategist.", "markdown");
        template = template.replace(new RegExp(`{{voice_trait_${i}_description}}`, 'g'), formatMarkdownContent(descResult.content || ''));

        // What It Means (3 examples)
        for (let j = 1; j <= 3; j++) {
          const meansPrompt = `For brand voice trait #${i} for ${validatedDetails.name}, give example #${j} of 'What It Means' (1 sentence, start with an arrow).`;
          const meansResult = await generateWithOpenAI(meansPrompt, "You are an expert brand strategist.", "markdown");
          template = template.replace(new RegExp(`{{voice_trait_${i}_means_${j}}}`, 'g'), formatMarkdownContent(meansResult.content || ''));
        }
        // What It Doesn't Mean (3 examples)
        for (let j = 1; j <= 3; j++) {
          const notMeansPrompt = `For brand voice trait #${i} for ${validatedDetails.name}, give example #${j} of 'What It Doesn't Mean' (1 sentence, start with a cross).`;
          const notMeansResult = await generateWithOpenAI(notMeansPrompt, "You are an expert brand strategist.", "markdown");
          template = template.replace(new RegExp(`{{voice_trait_${i}_not_means_${j}}}`, 'g'), formatMarkdownContent(notMeansResult.content || ''));
        }
      }
    } catch (error) {
      console.error("Error generating brand voice trait details:", error)
      throw new Error(`Brand voice trait generation failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    console.log("Voice trait placeholders replaced")

    // Generate rules for each section in chunks (core only)
    try {
      // Dynamically extract all rule section headers (### Section Name) from the template
      const ruleHeaderRegex = /### ([^\n]+)\n\s*{{rule_line}}/g;
      let match;
      const ruleSections = [];
      while ((match = ruleHeaderRegex.exec(template)) !== null) {
        ruleSections.push(match[1].trim());
      }

      for (const section of ruleSections) {
        const ruleResult = await generateStyleGuideRules(validatedDetails, section);
        if (ruleResult.success && ruleResult.content) {
          template = template.replace(/{{rule_line}}/, formatMarkdownContent(ruleResult.content));
        } else {
          template = template.replace(/{{rule_line}}/, "_Could not generate rule for this section._");
        }
      }
    } catch (error) {
      console.error("Error generating rules:", error)
      throw new Error(`Rule generation failed: ${error instanceof Error ? error.message : String(error)}`)
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
    return formatMarkdownContent(template)
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
const GENERIC_VOICE_TRAIT_1 = `Professional & Clear
We communicate with confidence and clarity, making complex ideas simple.`;

const GENERIC_VOICE_TRAIT_2 = `Friendly & Approachable
We use conversational language that makes our audience feel welcome and understood.`;

const GENERIC_RULE_LINE = `✅ Right: "Keep your message clear and direct"
❌ Wrong: "Utilize complex terminology to convey meaning"`;

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
      .replace(/{{rule_line}}/g, GENERIC_RULE_LINE);
    
    return preview;
  } catch (error) {
    console.error('Preview generation failed:', error);
    throw new Error(`Preview generation failed: ${error}`);
  }
}