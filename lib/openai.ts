import { OpenAI } from "openai"
import Logger from "./logger"
import { TRAITS, type MixedTrait, type TraitName, isPredefinedTrait, isCustomTrait } from "./traits"

interface GenerationResult {
  success: boolean
  content?: string
  error?: string
}

type ResponseFormat = "json" | "markdown"

async function validateJsonResponse(text: string): Promise<{ isValid: boolean; content?: any; error?: string }> {
  return {
    isValid: true,
    content: text
  }
}

async function validateMarkdownResponse(text: string): Promise<{ isValid: boolean; content?: string; error?: string }> {
  return {
    isValid: true,
    content: text
  }
}

async function cleanResponse(text: string, format: ResponseFormat): Promise<string> {
  // Remove any markdown code block syntax if it exists
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "")
  
  // Remove any leading/trailing whitespace
  text = text.trim()

  // For JSON responses, try to extract JSON if wrapped in markdown
  if (format === "json") {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      text = jsonMatch[0]
    }
  }
  
  return text
}

export async function generateWithOpenAI(
  prompt: string, 
  systemPrompt: string,
  responseFormat: ResponseFormat = "json",
  max_tokens: number = 2000,
  model: string = "gpt-4o-mini" // Default to faster model
): Promise<GenerationResult> {
  const maxAttempts = 3
  Logger.info("Starting OpenAI generation", { prompt: prompt.substring(0, 100) + "...", format: responseFormat, model })
  Logger.debug("Full prompt", { prompt })

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      Logger.debug(`OpenAI attempt ${attempt}/${maxAttempts}`)
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        max_tokens: max_tokens
      })

      const rawResponse = response.choices[0]?.message?.content
      if (!rawResponse) {
        throw new Error("Empty response from OpenAI")
      }

      Logger.debug("Raw OpenAI response", { response: rawResponse })

      // Log token usage information
      if (response.usage) {
        console.log("=".repeat(50))
        console.log("🔢 TOKEN USAGE SUMMARY")
        console.log("=".repeat(50))
        console.log(`Model: ${response.model}`)
        console.log(`Prompt tokens: ${response.usage.prompt_tokens}`)
        console.log(`Completion tokens: ${response.usage.completion_tokens}`) 
        console.log(`Total tokens: ${response.usage.total_tokens}`)
        console.log(`Max tokens requested: ${max_tokens}`)
        console.log("=".repeat(50))
      }

      // Clean the response based on expected format
      const cleanedResponse = await cleanResponse(rawResponse, responseFormat)
      Logger.debug("Cleaned response", { response: cleanedResponse })

      // Validate based on expected format
      const validation = responseFormat === "json" 
        ? await validateJsonResponse(cleanedResponse)
        : await validateMarkdownResponse(cleanedResponse)

      if (!validation.isValid) {
        if (attempt === maxAttempts) {
          throw new Error(`Failed to get valid ${responseFormat} after ${maxAttempts} attempts: ${validation.error}`)
        }
        Logger.warn(`Invalid ${responseFormat} response, retrying`, { attempt, error: validation.error })
        continue
      }

      Logger.info("OpenAI generation successful", { length: cleanedResponse.length, format: responseFormat })
      return {
        success: true,
        content: cleanedResponse
      }

    } catch (error) {
      if (attempt === maxAttempts) {
        Logger.error(
          "OpenAI generation failed",
          error instanceof Error ? error : new Error("Unknown error"),
          { attempt }
        )
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate content"
        }
      }
      Logger.warn("OpenAI generation attempt failed, retrying", {
        attempt,
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }
  }

  // This should never be reached due to the error handling above
  return {
    success: false,
    error: "Unexpected error in generation"
  }
}

// Helper function to convert predefined trait to markdown format
function predefinedTraitToMarkdown(traitName: TraitName, index: number): string {
  const trait = TRAITS[traitName]
  
  return `### ${index}. ${traitName}

${trait.definition}

***What It Means***

${trait.do.map(item => `→ ${item}`).join('\n')}

***What It Doesn't Mean***

${trait.dont.map(item => `✗ ${item}`).join('\n')}`
}

// Function to generate custom trait description via AI
async function generateCustomTraitDescription(traitName: string, brandDetails: any, index: number): Promise<string> {
  console.log(`🔧 [DEBUG] generateCustomTraitDescription called for trait: ${traitName}`)
  const keywordSection = Array.isArray(brandDetails.keywords) && brandDetails.keywords.length
    ? `\n• Keywords: ${brandDetails.keywords.slice(0, 10).join(', ')}`
    : '';
  
  const prompt = `You are a brand voice expert. Generate communication style guidelines for the trait "${traitName}" based on this brand information.

Brand Info:
• Brand Name: ${brandDetails.name}
• What they do: ${brandDetails.description}
• Audience: ${brandDetails.audience}${keywordSection}

Create the trait description in this EXACT format:

### ${index}. ${traitName}

[ONE SENTENCE description of what this trait means for this specific brand and why it's important. Explicitly reference the core audience at least once (e.g., "instills confidence in healthcare providers", "helps CFOs make faster decisions").]

***What It Means***

→ [Specific actionable writing instruction - around 10 words]
→ [Specific actionable writing instruction - around 10 words] 
→ [Specific actionable writing instruction - around 10 words]

***What It Doesn't Mean***

✗ [Boundary or guardrail - around 10 words]
✗ [Boundary or guardrail - around 10 words]
✗ [Boundary or guardrail - around 10 words]

These should guide HOW someone writes and speaks, not WHAT topics they cover. Focus on tone, word choice, sentence structure, and communication style tailored to the audience. Make each example about writing style and language use, not content strategy. Keep examples around 10 words. 

For "What It Doesn't Mean": Show where each "What It Means" example could go wrong or be overused, providing specific boundaries that prevent the trait from being taken too far. Use → (unicode arrow) and ✗ (unicode cross) exactly as shown.`;

  const result = await generateWithOpenAI(prompt, "You are a brand voice expert creating specific, actionable communication style guidelines.", "markdown", 800, "gpt-4o-mini");
  
  if (result.success && result.content) {
    return result.content.trim()
  } else {
    // Fallback if AI generation fails
    console.error(`Failed to generate trait description for ${traitName}:`, result.error)
    return `### ${index}. ${traitName}

This trait should be tailored specifically to ${brandDetails.name} and their ${brandDetails.audience || 'target audience'}.

***What It Means***

→ Use clear, professional language appropriate for your audience
→ Maintain consistent tone and style across all communications
→ Structure content logically for easy comprehension

***What It Doesn't Mean***

✗ Using generic examples that don't reflect your brand's uniqueness
✗ Applying this trait without considering your audience's expectations
✗ Taking this trait to extremes that don't align with your brand context`
  }
}

// Main function to generate brand voice traits using user's selected traits
export async function generateBrandVoiceTraits(brandDetails: any): Promise<GenerationResult> {
  try {
    // Check if we have selected traits
    if (!brandDetails.traits || !Array.isArray(brandDetails.traits) || brandDetails.traits.length === 0) {
      return {
        success: false,
        error: "No traits selected for this brand"
      }
    }

    console.log(`🎯 Processing ${brandDetails.traits.length} selected traits:`, brandDetails.traits)

    const traitMarkdown: string[] = []
    
    for (let i = 0; i < brandDetails.traits.length; i++) {
      const trait = brandDetails.traits[i]
      const index = i + 1
      
      if (typeof trait === 'string') {
        // Generate AI description for ALL traits (both predefined and custom)
        console.log(`🎨 Generating AI description for trait: ${trait}`)
        const markdown = await generateCustomTraitDescription(trait, brandDetails, index)
        traitMarkdown.push(markdown)
      } else if (trait && typeof trait === 'object') {
        // Handle MixedTrait objects - generate AI descriptions for ALL traits
        if (isPredefinedTrait(trait)) {
          console.log(`🎨 Generating AI description for predefined trait: ${trait.name}`)
          const markdown = await generateCustomTraitDescription(trait.name, brandDetails, index)
          traitMarkdown.push(markdown)
        } else if (isCustomTrait(trait)) {
          console.log(`🎨 Generating AI description for custom trait: ${trait.name}`)
          const markdown = await generateCustomTraitDescription(trait.name, brandDetails, index)
          traitMarkdown.push(markdown)
        }
      }
    }

    if (traitMarkdown.length === 0) {
      return {
        success: false,
        error: "No valid traits could be processed"
      }
    }

    const finalContent = traitMarkdown.join('\n\n')
    console.log(`✅ Generated brand voice traits successfully (${traitMarkdown.length} traits)`)
    
    return {
      success: true,
      content: finalContent
    }
    
  } catch (error) {
    console.error("Error in generateBrandVoiceTraits:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error generating brand voice traits"
    }
  }
}

/* Function to generate style guide rules
export async function generateStyleGuideRules(brandDetails: any, section: string): Promise<GenerationResult> {
  const prompt = `Create style guide rules for ${brandDetails.name}'s ${section} section.
  
Brand Description: ${brandDetails.description}
Target Audience: ${brandDetails.audience}
Tone: ${brandDetails.tone}

Consider how ${brandDetails.audience} will interact with the content. Rules should help content creators maintain a ${brandDetails.tone} tone while effectively communicating with this audience.

Provide 1 specific rule in this EXACT format:

[rule description]
✅ Right: [clear example that follows the rule]
❌ Wrong: [example that breaks the rule]

Each rule must:
1. Start with the rule name
2. Include a Right example with '✅ Right:'
3. Include a Wrong example with '❌ Wrong:'
4. Use markdown formatting for emphasis
5. Be specific and actionable

Provide exactly ONE rule for each section, not a list. Do NOT include more than one rule. Only output one rule block in the format below.

Example format:

Use active voice
✅ Right: "The team completed the project on time"
❌ Wrong: "The project was completed by the team"

Use British English spelling
✅ Right: "Colour"
❌ Wrong: "Color"`

  return generateWithOpenAI(prompt, "You are an expert content strategist who creates clear, actionable style guide rules.", "markdown")
}*/

// Function to generate the entire core style guide in one go
export async function generateFullCoreStyleGuide(brandDetails: any, traitsContext?: string): Promise<GenerationResult> {
  const traitsSection = traitsContext ? `\nTraits Context:\n${traitsContext}\n` : '';
  const styleConstraints = `\nStyle Constraints:\n- Formality: ${brandDetails.formalityLevel || 'Neutral'} (Professional: avoid contractions; Casual: allow contractions; Very Formal: use third person)\n- Reading Level: ${brandDetails.readingLevel || '10-12'} (6–8: short sentences, simple vocab; 13+: technical precision allowed)\n- English Variant: ${brandDetails.englishVariant || 'american'} (apply spelling and punctuation accordingly)`;
  const keywordSection = Array.isArray(brandDetails.keywords) && brandDetails.keywords.length
    ? `\nBrand Keywords (use naturally in examples where helpful):\n- ${brandDetails.keywords.slice(0, 15).join('\n- ')}`
    : '';
  const prompt = `You are a writing style guide expert. Based on the brand info below, create a set of 25 specific writing style rules for this brand.

Brand Info:
  • Brand Name: ${brandDetails.name}
  • Audience: ${brandDetails.audience}
  • Tone: ${brandDetails.tone}
  • What they do: ${brandDetails.summary || brandDetails.description}

${traitsSection}
${styleConstraints}
${keywordSection}

Instructions:
- Each rule must be about writing style, grammar, punctuation, spelling, or formatting.
- Do NOT include general brand, marketing, or content strategy rules.
- Use rules like: Capitalization, Numbers, Pronouns, Abbreviations, Acronyms, Titles & Headings, Trademarks, Slang & Jargon, Proper Nouns, 1st person vs 3rd person, Contractions, Compound Adjectives, Serial/Oxford Comma, Emojis, Job Titles, Dates & Times, Measurements, Money, Addresses, Special Characters, Hyphens, Dashes, Apostrophes, Quotation marks, etc.
- Each rule must:
  1. Start with a bold, single keyword (e.g., "Acronyms", "Capitalization", "Numbers").
  2. Give a **ONE SENTENCE** description of the rule and why it matters.
  3. Include a ✅ Right example and a ❌ Wrong example on separate lines.
  4. Be formatted in markdown.
- List the 25 rules in alphabetical order by keyword.
- Number each rule in the header: "### 1. Acronyms"
- Do not repeat rules or examples.
- Make each rule unique, clear, and actionable.
- Focus on how to write, edit, and format text for this brand.
- **IMPORTANT**: Put each ✅ Right and ❌ Wrong example on separate lines with line breaks between them.

Example rules:
### 1. Acronyms
Spell out acronyms on first use, then use the acronym only.
✅ Right: "World Health Organization (WHO)"
❌ Wrong: "WHO"

### 2. Capitalization
Use sentence case for headings and titles.
✅ Right: "How to write a style guide"
❌ Wrong: "How To Write A Style Guide"

### 3. Numbers
Write out numbers one through nine; use numerals for 10 and above.
✅ Right: "We have five products."
❌ Wrong: "We have 5 products."

### 4. Trademarks
Always use the correct trademark symbols for brand names.
✅ Right: "iPhone®"
❌ Wrong: "iPhone"

### 5. Serial Comma
Use the Oxford comma in lists of three or more items.
✅ Right: "We sell books, magazines, and newspapers."
❌ Wrong: "We sell books, magazines and newspapers."

---
Generate exactly 25 rules, each about a different aspect of writing style.`;
  return generateWithOpenAI(prompt, "You are a writing style guide expert.", "markdown", 6000, "gpt-4o-mini");
}

// Function to generate the entire complete style guide in one go
export async function generateCompleteStyleGuide(brandDetails: any, traitsContext?: string): Promise<GenerationResult> {
  const traitsSection = traitsContext ? `\nTraits Context:\n${traitsContext}\n` : '';
  const styleConstraints = `\nStyle Constraints:\n- Formality: ${brandDetails.formalityLevel || 'Neutral'} (Professional: avoid contractions; Casual: allow contractions; Very Formal: use third person)\n- Reading Level: ${brandDetails.readingLevel || '10-12'} (6–8: short sentences, simple vocab; 13+: technical precision allowed)\n- English Variant: ${brandDetails.englishVariant || 'american'} (apply spelling and punctuation accordingly)`;
  const keywordSection = Array.isArray(brandDetails.keywords) && brandDetails.keywords.length
    ? `\nBrand Keywords (use naturally in examples where helpful):\n- ${brandDetails.keywords.slice(0, 15).join('\n- ')}`
    : '';
  const prompt = `You are a writing style guide expert. Based on the brand info below, create a comprehensive set of writing style rules for this brand, covering all the detailed topics listed.

Brand Info:
  • Brand Name: ${brandDetails.name}
  • Audience: ${brandDetails.audience}
  • Tone: ${brandDetails.tone}
  • What they do: ${brandDetails.summary || brandDetails.description}

${traitsSection}
${styleConstraints}
${keywordSection}

Instructions:
- Each main section should be H2 (##) without numbers (e.g., "## Spelling Conventions").
- Each rule name should be H3 heading (###) with sequential numbering from 1 onwards.
- Do NOT break lines for dashes, slashes, or quotes—keep them in the same line as the text.
- Each rule must be about writing style, grammar, punctuation, spelling, or formatting.
- Do NOT include general brand, marketing, or content strategy rules.
- Each rule must:
  1. Start with an H3 heading with sequential number and keyword (e.g., "### 1. Company Name Spelling", "### 2. Proper Nouns").
  2. Give a **ONE SENTENCE** description of the rule and why it matters.
  3. Include a ✅ Right example and a ❌ Wrong example on separate lines.
  4. Be formatted in markdown.
- Do not repeat rules or examples.
- Make each rule unique, clear, and actionable.
- Focus on how to write, edit, and format text for this brand.
- **IMPORTANT**: Put each ✅ Right and ❌ Wrong example on separate lines with line breaks between them.
- Organize the rules into the following sections and topics, in this order:

## Spelling Conventions
   - ### 1. Capitalisation of Months of the Year
   - ### 2. Capitalisation of Seasons & Directions
   - ### 3. Company Name Spelling
   - ### 4. Complex vs. Simple Words
   - ### 5. Hyphenation in Heritage Terms
   - ### 6. Possessives
   - ### 7. Proper Nouns
   - ### 8. Spelling for Loanwords
   - ### 9. Spelling of Internet Terms
   - ### 10. UK vs. US English

## Grammar & Mechanics
   - ### 11. Abbreviations
   - ### 12. Acronyms
   - ### 13. Active vs. Passive Voice
   - ### 14. Capitalisation
   - ### 15. Compound Adjectives
   - ### 16. Contractions
   - ### 17. eg / ie / etc.
   - ### 18. Emojis
   - ### 19. Jargon Translation
   - ### 20. Job Titles
   - ### 21. Languages
   - ### 22. Sentence Case
   - ### 23. Title Case
   - ### 24. Upper Case

## Punctuation
   - ### 25. Accents
   - ### 26. Ampersands
   - ### 27. Apostrophes
   - ### 28. Asterisks
   - ### 29. At Symbols
   - ### 30. Colons
   - ### 31. Commas
   - ### 32. Ellipses
   - ### 33. Ellipsis Spacing
   - ### 34. Em Dash
   - ### 35. En Dash
   - ### 36. Exclamation Points
   - ### 37. Hash Symbols
   - ### 38. Hyphens
   - ### 39. Multiple Punctuation
   - ### 40. Parentheses
   - ### 41. Periods
   - ### 42. Pipes
   - ### 43. Question Marks
   - ### 44. Quotation Marks
   - ### 45. Semicolons
   - ### 46. Slashes
   - ### 47. Special Characters

## Formatting
   - ### 48. Alignment
   - ### 49. Bold and Italics
   - ### 50. Bullet Points
   - ### 51. Coloured Text
   - ### 52. Numbered Lists
   - ### 53. Spacing
   - ### 54. Strikethrough

## Digital & Web
   - ### 55. Alt Text
   - ### 56. Button Capitalisation
   - ### 57. Buttons
   - ### 58. Call-to-Action Text
   - ### 59. Character Limits for Inputs
   - ### 60. Checkboxes
   - ### 61. Email Addresses
   - ### 62. Empty State Guidance
   - ### 63. Error Message Tone
   - ### 64. File Extensions
   - ### 65. Forms
   - ### 66. Image Captions
   - ### 67. Loading State Messaging
   - ### 68. Meta Descriptions
   - ### 69. Radio Buttons
   - ### 70. Social Media Hashtags
   - ### 71. URL & Link Formatting
   - ### 72. UTM & Tracking Rules
   - ### 73. Video Transcripts

## Numbers & Data
   - ### 74. Big Numbers
   - ### 75. Dates
   - ### 76. Decimals
   - ### 77. Fractions
   - ### 78. Measurements
   - ### 79. Millions & Billions
   - ### 80. Money
   - ### 81. Numerals
   - ### 82. Percentages
   - ### 83. Ranges
   - ### 84. Telephone Numbers
   - ### 85. Temperature
   - ### 86. Time & Time Zones
   - ### 87. Weights
   - ### 88. Whole Numbers

## People & Inclusive Language
   - ### 89. Age References
   - ### 90. Disability-related Terms
   - ### 91. Gender & Sexuality Terminology
   - ### 92. Heritage & Nationality Terminology
   - ### 93. Mental Health Terminology
   - ### 94. Neurodiversity References
   - ### 95. Person-first Language
   - ### 96. Socio-economic References

## Points of View
   - ### 97. First vs. Third Person
   - ### 98. Pronouns

## Style Consistency
   - ### 99. AI-Generated Content Flags
   - ### 100. Consistency Review
   - ### 101. Disclaimers & Fine Print
   - ### 102. Readability Grade Target
   - ### 103. Sentence Length Limit
   - ### 104. Serial Comma
   - ### 105. Slang & Jargon
   - ### 106. Source Attribution
   - ### 107. Third-Party Brand References
   - ### 108. Titles and Headings
   - ### 109. Trademarks

Example rules:

### 3. Company Name Spelling
Always capitalize "${brandDetails.name}" consistently to maintain brand identity and recognition.
✅ Right: ${brandDetails.name} offers innovative solutions for businesses.
❌ Wrong: ${brandDetails.name.toLowerCase()} offers innovative solutions for businesses.

### 11. Abbreviations
Spell out abbreviations on first use, then use the shortened form consistently.
✅ Right: "The World Health Organization (WHO) recommends..."
❌ Wrong: "WHO recommends..." (without introduction)

### 71. URL & Link Formatting
Format web addresses consistently and use descriptive link text for accessibility.
✅ Right: "Read our [privacy policy](https://example.com/privacy) for details."
❌ Wrong: "Click here: https://example.com/privacy"

### 104. Serial Comma
Use the Oxford comma in lists of three or more items for clarity.
✅ Right: "We offer consulting, development, and support services."
❌ Wrong: "We offer consulting, development and support services."

### 81. Numerals 1–9
Write out numbers one through nine; use numerals for 10 and above.
✅ Right: "We have five products and 12 team members."
❌ Wrong: "We have 5 products and twelve team members."

### 27. Apostrophes
Use apostrophes correctly for contractions and possessives to maintain professional writing standards.
✅ Right: "The company's mission is to improve users' experiences."
❌ Wrong: "The companys mission is to improve users experiences."

### 49. Bold and Italics
Use bold for emphasis and key terms; use italics for foreign words and publication titles.
✅ Right: "Our **core values** include respect for all *stakeholders*."
❌ Wrong: "Our *core values* include respect for all **stakeholders**."

### 95. Person-first Language
Put the person before their condition or characteristic to show respect and dignity.
✅ Right: "We support employees with disabilities through accessible design."
❌ Wrong: "We support disabled employees through accessible design."

---
- Generate the rules in the exact order above with sequential ordering.
- Use markdown H2 (##) for each main section WITHOUT numbers (e.g., "## Spelling Conventions").
- Use H3 (###) for each rule name WITH sequential numbers (e.g., "### 1. Company Name Spelling").
- Start numbering from 1 and continue sequentially through all sections.
- Do not skip any rule or section.
- Generate exactly 98 rules total across all sections as listed above.
- Do not repeat rules or examples.
- Make each rule unique, clear, and actionable.
- Focus on how to write, edit, and format text for this brand.
`;
  return generateWithOpenAI(prompt, "You are a writing style guide expert.", "markdown", 9000, "gpt-4o-mini");
}

// Extract domain terms and a simple brand lexicon (preferred/banned terms)
export async function extractDomainTermsAndLexicon(params: { name: string; description: string }): Promise<GenerationResult> {
  const { name, description } = params
  const prompt = `From the brand info below, extract domain-specific keywords and a short brand lexicon.

Return strict JSON with this shape:
{
  "domainTerms": ["term1", "term2", "term3", "term4", "term5"],
  "lexicon": {
    "preferred": ["preferred term 1", "preferred term 2"],
    "banned": ["banned term 1", "banned term 2"]
  }
}

Guidelines:
- Choose concrete, non-generic domain terms (products, features, industry jargon users would actually write).
- Preferred terms: words/phrases the brand should use consistently.
- Banned terms: confusing or off-brand alternatives to avoid.
- Keep arrays short (5–10 domain terms; 2–5 preferred; 2–5 banned).

Brand Name: ${name}
Brand Description: ${description}`

  return generateWithOpenAI(
    prompt,
    "You are a careful content taxonomist. Return strict JSON only.",
    "json",
    400,
    "gpt-4o-mini"
  )
}

// Generate a short internal audience description (1–2 sentences, ~25–40 words)
export async function generateAudienceSummary(params: { name: string; description: string }): Promise<GenerationResult> {
  const { name, description } = params
  const prompt = `Based on the brand below, write a concise audience description (1–2 sentences, ~25–40 words). Keep it practical and specific. Output plain text only.

Brand Name: ${name}
What they do: ${description}`

  return generateWithOpenAI(
    prompt,
    "You are a brand strategist who writes precise, practical audience descriptions.",
    "markdown",
    200,
    "gpt-4o-mini"
  )
}

// Function to generate a concise brand summary from a single textarea
export async function generateBrandSummary(brandDetails: any): Promise<GenerationResult> {
  const prompt = `Write a single paragraph (30–40 words) that starts with the brand name and summarizes the brand using all key info, keywords, and terms from the input below. Use the specified tone.\n\nBrand Info:\n${brandDetails.brandDetailsText}\nTone: ${brandDetails.tone}`;
  return generateWithOpenAI(prompt, "You are a brand strategist.", "markdown");
}

// Function to extract just the brand name from brandDetailsText
export async function extractBrandName(brandDetails: any): Promise<GenerationResult> {
  const prompt = `Extract only the brand name from the text below. Return just the brand name, nothing else.\n\nBrand Info:\n${brandDetails.brandDetailsText}`;
  return generateWithOpenAI(prompt, "You are a brand analyst. Extract only the brand name from the given text.", "markdown");
}
