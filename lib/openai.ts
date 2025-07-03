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

// Function to format selected brand voice traits using static definitions
export async function generateBrandVoiceTraits(brandDetails: any): Promise<GenerationResult> {
  const { TRAITS } = await import('./traits');
  const selectedTraits = brandDetails.traits || [];
  
  if (selectedTraits.length === 0) {
    return {
      success: false,
      error: "No voice traits selected"
    };
  }

  try {
    let formattedTraits = '';
    
    selectedTraits.forEach((traitName: string, index: number) => {
      const trait = TRAITS[traitName as keyof typeof TRAITS];
      if (!trait) return;
      
      formattedTraits += `### ${index + 1}. ${traitName}\n\n`;
      formattedTraits += `${trait.definition}\n\n`;
      formattedTraits += `***What It Means***\n\n`;
      trait.do.forEach(item => {
        formattedTraits += `→ ${item}\n`;
      });
      formattedTraits += `\n***What It Doesn't Mean***\n\n`;
      trait.dont.forEach(item => {
        formattedTraits += `✗ ${item}\n`;
      });
      
      if (index < selectedTraits.length - 1) {
        formattedTraits += `\n---\n\n`;
      }
    });

    return {
      success: true,
      content: formattedTraits
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to format voice traits"
    };
  }
}

/* Function to generate style guide rules
export async function generateStyleGuideRules(brandDetails: any, section: string): Promise<GenerationResult> {
  const prompt = `Create style guide rules for ${brandDetails.name}'s ${section} section.
  
Brand Description: ${brandDetails.description}
Target Audience: ${brandDetails.audience}

Consider how ${brandDetails.audience} will interact with the content.

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
  const formalityText = brandDetails.formalityLevel || "Neutral";
  const readingLevelText = brandDetails.readingLevel === "6-8" ? "Grade 6-8 (General Public)" : 
                           brandDetails.readingLevel === "10-12" ? "Grade 10-12 (Professional)" : 
                           "Grade 13+ (Technical/Academic)";
  
  const englishVariant = brandDetails.englishVariant === "british" ? "British English" : "American English";
  
  // Format selected voice traits
  const voiceTraits = brandDetails.traits && Array.isArray(brandDetails.traits) && brandDetails.traits.length > 0 
    ? brandDetails.traits.join(", ") 
    : "Not specified";
  
  const prompt = `You are a writing style guide expert. Based on the brand info below, create a set of 25 specific writing style rules for this brand.

Brand Info:
  • Brand Name: ${brandDetails.name}
  • Audience: ${brandDetails.audience}
  • Voice Traits: ${voiceTraits}
  • Formality Level: ${formalityText}
  • Reading Level: ${readingLevelText}
  • English Variant: ${englishVariant}
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
  const formalityText = brandDetails.formalityLevel || "Neutral";
  const readingLevelText = brandDetails.readingLevel === "6-8" ? "Grade 6-8 (General Public)" : 
                           brandDetails.readingLevel === "10-12" ? "Grade 10-12 (Professional)" : 
                           "Grade 13+ (Technical/Academic)";
  
  const englishVariant = brandDetails.englishVariant === "british" ? "British English" : "American English";
  
  // Format selected voice traits
  const voiceTraits = brandDetails.traits && Array.isArray(brandDetails.traits) && brandDetails.traits.length > 0 
    ? brandDetails.traits.join(", ") 
    : "Not specified";
  
  const prompt = `You are a writing style guide expert. Based on the brand info below, create a comprehensive set of writing style rules for this brand, covering all the detailed topics listed.

Brand Info:
  • Brand Name: ${brandDetails.name}
  • Audience: ${brandDetails.audience}
  • Voice Traits: ${voiceTraits}
  • Formality Level: ${formalityText}
  • Reading Level: ${readingLevelText}
  • English Variant: ${englishVariant}
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
  const prompt = `Write a single paragraph (30–40 words) that starts with the brand name and summarizes the brand using all key info, keywords, and terms from the input below.\n\nBrand Info:\n${brandDetails.brandDetailsText}`;
  return generateWithOpenAI(prompt, "You are a brand strategist.", "markdown");
}

// Function to extract just the brand name from brandDetailsText
export async function extractBrandName(brandDetails: any): Promise<GenerationResult> {
  const prompt = `Extract only the brand name from the text below. Return just the brand name, nothing else.\n\nBrand Info:\n${brandDetails.brandDetailsText}`;
  return generateWithOpenAI(prompt, "You are a brand analyst. Extract only the brand name from the given text.", "markdown");
}

// Function to generate expanded brand description from brief input
export async function generateBrandDescription(briefDescription: string): Promise<GenerationResult> {
  const prompt = `Based on the brief brand description below, generate a comprehensive brand profile.

Return a JSON object with two fields:
1. "brandName": The exact name of the company/brand (just the name, nothing else)
2. "description": A detailed paragraph (40-60 words) that follows this structure:
   - Start with the brand name followed by what they are/do
   - Include their main products/services
   - Specify their target audience
   - Mention what makes them unique or their key value proposition

Your description should be:
- Professional, clear and easy to read 
- Factual, not promotional
- Written in third person
- Focused on their current offerings
- Use short sentences and simple punctuation

Examples: 
{
  "brandName": "Nike",
  "description": "Nike is a leading sports brand that designs, manufactures, and markets athletic footwear, apparel, equipment, and accessories worldwide. Nike targets athletes and sports enthusiasts of all levels, from professional competitors to casual fitness enthusiasts. The company is known for its innovative product design, performance technology, and inspirational marketing campaigns."
}

{
  "brandName": "Spotify", 
  "description": "Spotify is a digital music streaming platform that provides instant access to millions of songs, podcasts, and audio content. Spotify serves music lovers, podcast listeners, and content creators across all demographics globally. The platform is recognized for its personalized playlists, music discovery algorithms, and both free and premium subscription models."
}

Brief Description:
${briefDescription}
`;

  return generateWithOpenAI(
    prompt,
    "You are an expert brand analyst with experience writing clear, comprehensive brand profiles. Use simple language and professional tone. Always return valid JSON with the exact structure requested.",
    "json",
    600 // Moderate token limit for detailed but concise descriptions
  );
}
