import { NextResponse } from "next/server"
import { generateWithOpenAI } from "@/lib/openai"
import Logger from "@/lib/logger"
import { validateUrl } from "@/lib/url-validation"

// Define interfaces for brand details
interface TargetAudienceDetail {
  demographic: {
    age: string
    occupation: string
    location: string
  }
  interestsValues: string[]
  context: string
  needsPainPoints: string
}

interface BrandDetails {
  name: string
  industry: string
  description: string
  values: string[]
  targetAudience: TargetAudienceDetail | string
  tone: string
  competitors: string[]
  uniqueSellingPoints: string[]
}

interface ProcessedBrandDetails extends Omit<BrandDetails, 'targetAudience'> {
  targetAudience: string
  _rawTargetAudience?: TargetAudienceDetail
}

const REQUIRED_FIELDS = [
  "name",
  "industry",
  "description",
  "values",
  "targetAudience",
  "tone",
  "competitors",
  "uniqueSellingPoints"
] as const

// Function to flatten target audience object into a string
function flattenTargetAudience(audience: TargetAudienceDetail): string {
  const parts = []
  
  // Add demographic info
  if (audience.demographic) {
    const demo = []
    if (audience.demographic.occupation) demo.push(audience.demographic.occupation)
    if (audience.demographic.age) demo.push(`aged ${audience.demographic.age}`)
    if (audience.demographic.location) demo.push(`in ${audience.demographic.location}`)
    if (demo.length) parts.push(demo.join(" "))
  }

  // Add interests and values
  if (audience.interestsValues?.length) {
    parts.push(`interested in ${audience.interestsValues.join(", ")}`)
  }

  // Add context if available
  if (audience.context) {
    parts.push(audience.context)
  }

  return parts.join(" who are ")
}

export async function POST(request: Request) {
  Logger.info("Received extract website request")

  try {
    // Parse request body
    const body = await request.json()
    Logger.debug("Request body", { body })

    if (!body.url) {
      Logger.error("Missing URL in request")
      return NextResponse.json(
        {
          success: false,
          message: "URL is required",
          error: "Missing required field: url",
        },
        { status: 400 }
      )
    }

    // Validate URL
    const urlValidation = validateUrl(body.url)
    if (!urlValidation.isValid) {
      Logger.error("Invalid URL provided", new Error(urlValidation.error))
      return NextResponse.json(
        {
          success: false,
          message: "Invalid URL provided",
          error: urlValidation.error,
        },
        { status: 400 }
      )
    }

    // First test the API key
    const testUrl = new URL("/api/test-openai-connection", request.url).toString()
    const testResponse = await fetch(testUrl)
    const testData = await testResponse.json()

    if (!testData.success) {
      throw new Error(testData.error || "API key validation failed")
    }

    // Fetch the website HTML
    const siteResponse = await fetch(urlValidation.url)
    const html = await siteResponse.text()

    // Generate prompt for website extraction with improved guidance
    const prompt = `Analyze the following HTML content and extract:
- Brand name
- High-level description (1-2 sentences)
- Target audience (1-2 sentences)
Return your answer as a JSON object with these keys: name, description, audience.
If you can't find a value, use "Not specified".
HTML Content:
${html}
`

    const result = await generateWithOpenAI(
      prompt,
      "You are an expert brand analyst. Always respond with valid JSON. Use only the three keys: name, description, audience. If you can't find enough info, use 'Not specified'."
    )

    if (!result.success || !result.content) {
      throw new Error(result.error || "Failed to extract brand information")
    }

    // Parse and validate the response
    let brandDetails: any
    try {
      let content = result.content.trim()
      // Remove code block markers if present
      if (content.startsWith("```")) {
        content = content.replace(/^```(json)?/i, "").replace(/```$/, "").trim()
      }
      brandDetails = JSON.parse(content)
      Logger.debug("Parsed brand details", { brandDetails })
      // No tone field needed
    } catch (parseError) {
      Logger.error("Error parsing OpenAI response", parseError instanceof Error ? parseError : new Error())
      throw new Error("Failed to parse brand information")
    }

    Logger.info("Successfully extracted brand information")
    return NextResponse.json({
      success: true,
      message: "Successfully extracted brand information",
      brandDetails,
    })
  } catch (error) {
    Logger.error(
      "Error in extract-website API",
      error instanceof Error ? error : new Error("Unknown error")
    )

    return NextResponse.json(
      {
        success: false,
        message: "Failed to extract brand information",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    )
  }
}
