import { OpenAI } from "openai";
import Logger from "./logger";

interface GenerationResult {
  success: boolean;
  content?: string;
  error?: string;
}

type ResponseFormat = "json" | "markdown";

async function validateJsonResponse(
  text: string
): Promise<{ isValid: boolean; content?: any; error?: string }> {
  try {
    const content = JSON.parse(text);
    return { isValid: true, content };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid JSON format",
    };
  }
}

async function validateMarkdownResponse(
  text: string
): Promise<{ isValid: boolean; content?: string; error?: string }> {
  // Basic markdown validation - check for headers and formatting
  if (!text.includes("###") || !text.includes("**")) {
    return {
      isValid: false,
      error: "Invalid markdown format - missing headers or formatting",
    };
  }
  return {
    isValid: true,
    content: text,
  };
}

async function cleanResponse(
  text: string,
  format: ResponseFormat
): Promise<string> {
  // Remove any markdown code block syntax if it exists
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");

  // Remove any leading/trailing whitespace
  text = text.trim();

  // For JSON responses, try to extract JSON if wrapped in markdown
  if (format === "json") {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
  }

  return text;
}

export async function generateWithOpenAI(
  prompt: string,
  systemPrompt: string,
  responseFormat: ResponseFormat = "json"
): Promise<GenerationResult> {
  const maxAttempts = 3;
  Logger.info("Starting OpenAI generation", {
    prompt: prompt.substring(0, 100) + "...",
    format: responseFormat,
  });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      Logger.debug(`OpenAI attempt ${attempt}/${maxAttempts}`);

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const rawResponse = response.choices[0]?.message?.content;
      if (!rawResponse) {
        throw new Error("Empty response from OpenAI");
      }

      Logger.debug("Raw OpenAI response", { response: rawResponse });

      // Clean the response based on expected format
      const cleanedResponse = await cleanResponse(rawResponse, responseFormat);
      Logger.debug("Cleaned response", { response: cleanedResponse });

      // Validate based on expected format
      const validation =
        responseFormat === "json"
          ? await validateJsonResponse(cleanedResponse)
          : await validateMarkdownResponse(cleanedResponse);

      if (!validation.isValid) {
        if (attempt === maxAttempts) {
          throw new Error(
            `Failed to get valid ${responseFormat} after ${maxAttempts} attempts: ${validation.error}`
          );
        }
        Logger.warn(`Invalid ${responseFormat} response, retrying`, {
          attempt,
          error: validation.error,
        });
        continue;
      }

      Logger.info("OpenAI generation successful", {
        length: cleanedResponse.length,
        format: responseFormat,
      });
      return {
        success: true,
        content: cleanedResponse,
      };
    } catch (error) {
      if (attempt === maxAttempts) {
        Logger.error(
          "OpenAI generation failed",
          error instanceof Error ? error : new Error("Unknown error"),
          { attempt }
        );
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate content",
        };
      }
      Logger.warn("OpenAI generation attempt failed, retrying", {
        attempt,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // This should never be reached due to the error handling above
  return {
    success: false,
    error: "Unexpected error in generation",
  };
}

// Function to generate brand voice traits
export async function generateBrandVoiceTraits(
  brandDetails: any
): Promise<GenerationResult> {
  const prompt = `Create three distinct brand voice traits for ${brandDetails.name}.
  
Brand Description: ${brandDetails.description}
Target Audience: ${brandDetails.audience}
Tone: ${brandDetails.tone}

Consider the target audience carefully. The voice traits should resonate with ${brandDetails.audience} while maintaining the ${brandDetails.tone} tone.

For each trait, provide:
1. A clear title
2. A brief description
3. "What It Means" - 3 specific guidelines
4. "What It Doesn't Mean" - 3 things to avoid

Format in markdown with ### headers for each trait.`;

  return generateWithOpenAI(
    prompt,
    "You are an expert brand strategist.",
    "markdown"
  );
}

// Function to generate style guide rules
export async function generateStyleGuideRules(
  brandDetails: any,
  section: string
): Promise<GenerationResult> {
  const prompt = `Create style guide rules for ${brandDetails.name}'s ${section} section.
  
Brand Description: ${brandDetails.description}
Target Audience: ${brandDetails.audience}
Tone: ${brandDetails.tone}

Consider how ${brandDetails.audience} will interact with the content. Rules should help content creators maintain a ${brandDetails.tone} tone while effectively communicating with this audience.

Provide 3-5 specific rules in this EXACT format:

### Rule Name
- **Right**: [clear example that follows the rule]
- **Wrong**: [example that breaks the rule]

Each rule must:
1. Start with "###" followed by the rule name
2. Include a "Right" example with "- **Right**:"
3. Include a "Wrong" example with "- **Wrong**:"
4. Use markdown formatting for emphasis
5. Be specific and actionable

Example format:
### Use Active Voice
- **Right**: "The team completed the project on time"
- **Wrong**: "The project was completed by the team"`;

  return generateWithOpenAI(
    prompt,
    "You are an expert content strategist who creates clear, actionable style guide rules.",
    "markdown"
  );
}
