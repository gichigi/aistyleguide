import { OpenAI } from "openai"
import Logger from "./logger"

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
  model: string = "gpt-3.5-turbo" // Default to faster model
): Promise<GenerationResult> {
  const maxAttempts = 3
  Logger.info("Starting OpenAI generation", { prompt: prompt.substring(0, 100) + "...", format: responseFormat, model })

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

// Function to generate brand voice traits
export async function generateBrandVoiceTraits(brandDetails: any): Promise<GenerationResult> {
  const prompt = `You are a brand strategist. Based on the following brand information, generate exactly 3 unique, complementary brand voice traits for this brand.\n\nBrand Info:\n• Brand Name: ${brandDetails.name}\n• Audience: ${brandDetails.audience}\n• Tone: ${brandDetails.tone}\n• What they do: ${brandDetails.summary || brandDetails.description}\n\nFor each trait, provide:\n1. A short, bold title as a numbered Markdown header (use \`### 1. TraitName\`, \`### 2. TraitName\`, etc.), with a blank line before and after.\n2. A **ONE SENTENCE** description of the trait and why it's important for this brand.\n3. "What It Means": 3 specific, actionable examples, each starting with → (unicode arrow, not emoji).  \n   - Place these under a bolded subheading: \`***What It Means***\`  \n   - Add a blank line before and after this section.\n4. "What It Doesn't Mean": 3 clarifications to avoid misinterpretation, each starting with ✗ (unicode cross, not emoji).  \n   - Place these under a bolded subheading: \`***What It Doesn't Mean***\`  \n   - Add a blank line before and after this section.\n\nFormatting rules:\n- Always use a blank line between each trait and each section.\n- Use numbered Markdown headers for trait names (### 1. TraitName, ### 2. TraitName, etc.).\n- Do not use bullet points.\n- Do not use meta-text, headings, or quote marks around trait titles.\n\nExample format:\n\n### 1. Simplicity\n\nA one-sentence description of the trait and why it's important.\n\n***What It Means***\n\n→ Use plain English and avoid jargon or unnecessary complexity.  \n→ Short, punchy sentences that get straight to the point.  \n→ Prioritize clarity so anyone can understand our message without a dictionary.\n\n***What It Doesn't Mean***\n\n✗ Dumbing down ideas or skipping important details.  \n✗ Ignoring nuance when discussing more advanced topics.  \n✗ Simplistic design or lack of depth in our overall communications.\n\n### 2. Boldness\n\nA one-sentence description of the trait and why it's important.\n\n***What It Means***\n\n→ Take clear stances on important topics.  \n→ Use confident, assertive language.  \n→ Encourage creative risk-taking in messaging.\n\n***What It Doesn't Mean***\n\n✗ Being aggressive or dismissive of other views.  \n✗ Making unsupported claims.  \n✗ Ignoring feedback or new ideas.\n\n### 3. Empathy\n\nA one-sentence description of the trait and why it's important.\n\n***What It Means***\n\n→ Show understanding of the user's needs and feelings.  \n→ Use language that acknowledges challenges and celebrates wins.  \n→ Make content feel personal and supportive.\n\n***What It Doesn't Mean***\n\n✗ Overpromising solutions to every problem.  \n✗ Using patronizing or insincere language.  \n✗ Ignoring the diversity of user experiences.\n\n---\nNow, generate 3 traits in this format.`;
  return generateWithOpenAI(prompt, "You are a brand strategist.", "markdown", 2000, "gpt-4o");
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
export async function generateFullCoreStyleGuide(brandDetails: any): Promise<GenerationResult> {
  const prompt = `You are a writing style guide expert. Based on the brand info below, create a set of 25 specific writing style rules for this brand.

Brand Info:
  • Brand Name: ${brandDetails.name}
  • Audience: ${brandDetails.audience}
  • Tone: ${brandDetails.tone}
  • What they do: ${brandDetails.summary || brandDetails.description}

Instructions:
- Each rule must be about writing style, grammar, punctuation, spelling, or formatting.
- Do NOT include general brand, marketing, or content strategy rules.
- Use rules like: Capitalization, Numbers, Pronouns, Abbreviations, Acronyms, Titles & Headings, Trademarks, Slang & Jargon, Proper Nouns, 1st person vs 3rd person, Contractions, Compound Adjectives, Serial/Oxford Comma, Emojis, Job Titles, Dates & Times, Measurements, Money, Addresses, Special Characters, Hyphens, Dashes, Apostrophes, Quotation marks, etc.
- Each rule must:
  1. Start with a bold, single keyword (e.g., "Acronyms", "Capitalization", "Numbers").
  2. Give a **ONE SENTENCE** description of the rule and why it matters.
  3. Include a ✅ Right example and a ❌ Wrong example.
  4. Be formatted in markdown.
- List the 25 rules in alphabetical order by keyword.
- Number each rule in the header: "### 1. Acronyms"
- Do not repeat rules or examples.
- Make each rule unique, clear, and actionable.
- Focus on how to write, edit, and format text for this brand.

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
  return generateWithOpenAI(prompt, "You are a writing style guide expert.", "markdown", 3000, "gpt-4o");
}

// Function to generate the entire complete style guide in one go
export async function generateCompleteStyleGuide(brandDetails: any): Promise<GenerationResult> {
  const prompt = `You are a writing style guide expert. Based on the brand info below, create a comprehensive set of writing style rules for this brand, covering all the detailed topics listed.

Brand Info:
  • Brand Name: ${brandDetails.name}
  • Audience: ${brandDetails.audience}
  • Tone: ${brandDetails.tone}
  • What they do: ${brandDetails.summary || brandDetails.description}

Instructions:
- The main title should be H1 and say 'Apple Style Rules'.
- Each main section (e.g. '1. Spelling Conventions') should be H2 (##).
- Each rule name (e.g. 'Company Name Spelling') should be bold paragraph text, not a heading.
- Do NOT break lines for dashes, slashes, or quotes—keep them in the same line as the text.
- Each rule must be about writing style, grammar, punctuation, spelling, or formatting.
- Do NOT include general brand, marketing, or content strategy rules.
- For each rule:
  1. Start with a bold, single keyword or phrase matching the topic (e.g., "Abbreviations", "Capitalisation", "Emojis", "Company name spelling").
  2. Give a **ONE SENTENCE** description of the rule and why it matters.
  3. Include a ✅ Right example and a ❌ Wrong example.
  4. Be formatted in markdown.
- Organize the rules into the following sections and topics, in this order:

1. Spelling conventions
   - Company name spelling
   - Proper nouns
   - Hyphenation in heritage terms
   - Numbers 1–9
   - Complex vs. simple words

2. Grammar & mechanics
   - Abbreviations
   - Acronyms
   - Active vs. passive voice
   - Capitalisation
   - Title case
   - Sentence case
   - Upper case
   - Contractions
   - Compound adjectives
   - eg / ie / etc.
   - Emojis
   - Job titles
   - Languages

3. Punctuation
   - Accents
   - Apostrophes
   - Ampersands
   - Colons
   - Commas
   - Em dash
   - En dash
   - Ellipses
   - Exclamation points
   - Slashes ( / \\ )
   - Hyphens
   - Periods / full stops
   - Parentheses / brackets
   - Pipes
   - Semicolons
   - Special characters
   - Question marks
   - Quotation marks

4. Formatting & UI elements
   - Alignment
   - Alt text
   - Bold / italics / underlines
   - Bullet points
   - Buttons
   - Coloured text
   - Checkboxes
   - Email addresses
   - File extensions
   - Forms
   - Links
   - Numbered lists
   - Radio buttons
   - Spacing
   - Strikethrough

5. Numbers & data
   - 1–9
   - Big numbers
   - Dates
   - Decimals
   - Fractions
   - Measurements
   - Millions & billions
   - Money
   - Percentages
   - Ranges
   - Telephone numbers
   - Temperature
   - Time & time zones
   - Weights
   - Whole numbers

6. People & Inclusive language
   - Person‑first language
   - Disability‑related terms
   - Gender & sexuality terminology
   - Heritage & nationality terminology
   - Age references
   - Neurodiversity references
   - Socio‑economic references

7. Points of view
   - First vs. third person
   - Pronouns

8. Style consistency
   - Serial comma
   - Slang & jargon
   - Titles, headings & subheadings
   - Trademarks
   - Consistency review

Example format for each rule:

**Company Name Spelling**
Always capitalize "Apple" and use it consistently to reinforce brand identity.
✅ Right: Apple products are popular among designers.
❌ Wrong: apple products are popular among designers.

---
- Generate the rules in the order above.
- Use markdown H2 (##) for each main section.
- Use bold paragraph text for each rule name.
- Do not skip any rule or section.
- Do not repeat rules or examples.
- Make each rule unique, clear, and actionable.
- Focus on how to write, edit, and format text for this brand.
`;
  return generateWithOpenAI(prompt, "You are a writing style guide expert.", "markdown", 6000);
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
