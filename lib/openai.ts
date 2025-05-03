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
  responseFormat: ResponseFormat = "json"
): Promise<GenerationResult> {
  const maxAttempts = 3
  Logger.info("Starting OpenAI generation", { prompt: prompt.substring(0, 100) + "...", format: responseFormat })

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      Logger.debug(`OpenAI attempt ${attempt}/${maxAttempts}`)
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
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
  const prompt = `You are a brand strategist. Based on the following brand information, generate exactly 3 unique, complementary brand voice traits for this brand.

Brand Info:
• Brand Name: ${brandDetails.name}
• Audience: ${brandDetails.audience}
• Tone: ${brandDetails.tone}
• What they do: ${brandDetails.summary || brandDetails.description}

For each trait, provide:
1. A short, bold title (no quotes, no numbering, no meta-text like "Brand voice trait").
2. A 1–2 sentence description of the trait and why it matters for this brand.
3. "What It Means": 3 specific, actionable examples, each starting with → (unicode arrow, not emoji). Do not use bullet points.
4. "What It Doesn't Mean": 3 clarifications to avoid misinterpretation, each starting with ✗ (unicode cross, not emoji). Do not use bullet points. Do not just write the opposite; clarify boundaries or common mistakes.

Each trait should be distinct and together they should form a well-rounded, complementary set—no overlap or repetition.

Do not use meta-text, headings, or quote marks around trait titles.

Example format:

### Simplicity

***What It Means***
→ Use plain English and avoid jargon or unnecessary complexity.
→ Short, punchy sentences that get straight to the point.
→ Prioritize clarity so anyone can understand our message without a dictionary.

***What It Doesn't Mean***
✗ Dumbing down ideas or skipping important details.
✗ Ignoring nuance when discussing more advanced topics.
✗ Simplistic design or lack of depth in our overall communications.

---
Now, generate 3 traits in this format.`;
  return generateWithOpenAI(prompt, "You are a brand strategist.", "markdown");
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
  const prompt = `You are a brand style expert. Based on the following brand information, generate a complete writing style guide made of 25 original writing rules.

Brand Info:
  • Brand Name: ${brandDetails.name}
  • Audience: ${brandDetails.audience}
  • Tone: ${brandDetails.tone}
  • What they do: ${brandDetails.summary || brandDetails.description}

Each rule must:
  1. Be a clear, actionable writing rule (not a general content or marketing tip).
  2. Guide how to write, edit, and format text for this brand's content.
  3. Begin with a rule name in bold that is a single, clear keyword (e.g., Clarity, Verbs, Paragraphs, Spelling, Jargon, Headings, Sentences, etc.). Do not use a phrase or sentence. Do not use more than one word for the rule name.
  4. Follow with a 1–2 sentence description of what the rule is and why it matters for this brand.
  5. Include a ✅ Right example that clearly follows the rule.
  6. Include a ❌ Wrong example that breaks it.
  7. Be formatted in markdown.

Additional instructions:
- The 25 rules should be listed in alphabetical order by the single keyword rule name.
- Number each rule (1-25) in its header like: "### 1. Clarity" (not "**1. Clarity**").
- For each rule, choose a single, clear, writing topic as the keyword (e.g., Paragraphs, Verbs, Clarity, Jargon, Headings, Sentences, Spelling, etc.). Always alphabetize the rules by this single keyword.
- Do not repeat rules or examples—each rule must be unique.
- Keep the length of rule names, descriptions, and examples consistent across all rules for a uniform appearance.
- Focus on writing style, grammar, sentence structure, punctuation, spelling, word choice, inclusivity, clarity, formatting, voice consistency, contractions, active/passive voice, and similar writing-focused areas.
- Do NOT include rules about social media engagement, visual content, marketing, or general content strategy.

You must generate exactly 25 rules, covering the full range of writing style for this brand.
These rules should be specific, relevant to this brand, and helpful for any content creator writing in their voice.
Do not use generic rules from a template. Generate new ones, grounded in the brand's unique audience and tone.

Example format:

### 1. Clarity
Keep language clear and direct for all audiences.
✅ Right: "Our app is easy to use."
❌ Wrong: "Our application provides a user-centric experience with robust functionality."

### 2. Paragraphs
Use short paragraphs for easy reading.
✅ Right: "Each idea gets its own paragraph."
❌ Wrong: "Combine multiple ideas into one long paragraph."

### 3. Verbs
Choose strong, active verbs for action and clarity.
✅ Right: "Update your profile."
❌ Wrong: "Your profile can be updated."

---
`;
  return generateWithOpenAI(prompt, "You are a brand style expert.", "markdown");
}
