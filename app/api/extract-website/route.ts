import { NextResponse } from "next/server";
import { generateWithOpenAI } from "@/lib/openai";
import Logger from "@/lib/logger";
import { validateUrl } from "@/lib/url-validation";

// Define interfaces for brand details
interface TargetAudienceDetail {
  demographic: {
    age: string;
    occupation: string;
    location: string;
  };
  interestsValues: string[];
  context: string;
  needsPainPoints: string;
}

interface BrandDetails {
  name: string;
  industry: string;
  description: string;
  values: string[];
  targetAudience: TargetAudienceDetail | string;
  tone: string;
  competitors: string[];
  uniqueSellingPoints: string[];
}

interface ProcessedBrandDetails extends Omit<BrandDetails, "targetAudience"> {
  targetAudience: string[];
  _rawTargetAudience?: TargetAudienceDetail;
}

const REQUIRED_FIELDS = [
  "name",
  "industry",
  "description",
  "values",
  "targetAudience",
  "tone",
  "competitors",
  "uniqueSellingPoints",
] as const;

// Function to flatten target audience object into a string
function flattenTargetAudience(audience: TargetAudienceDetail): string[] {
  const parts = [];

  // Add demographic info
  if (audience.demographic) {
    const demo = [];
    if (audience.demographic.occupation)
      demo.push(audience.demographic.occupation);
    if (audience.demographic.age) demo.push(`aged ${audience.demographic.age}`);
    if (audience.demographic.location)
      demo.push(`in ${audience.demographic.location}`);
    if (demo.length) parts.push(`${demo.join(" ")}`);
  }

  // Add interests and values
  if (audience.interestsValues?.length) {
    parts.push(
      `Common interests include ${audience.interestsValues.join(", ")}`
    );
  }

  // Add context if available
  if (audience.context) {
    parts.push(`${audience.context}`);
  }

  return parts;
}

export async function POST(request: Request) {
  Logger.info("Received extract website request");

  try {
    // Parse request body
    const body = await request.json();
    Logger.debug("Request body", { body });

    if (!body.url) {
      Logger.error("Missing URL in request");
      return NextResponse.json(
        {
          success: false,
          message: "URL is required",
          error: "Missing required field: url",
        },
        { status: 400 }
      );
    }

    // Validate URL
    const urlValidation = validateUrl(body.url);

    if (!urlValidation.isValid) {
      Logger.error("Invalid URL provided", new Error(urlValidation.error));
      return NextResponse.json(
        {
          success: false,
          message: "Invalid URL provided",
          error: urlValidation.error,
        },
        { status: 400 }
      );
    }

    // First test the API key
    // const testUrl = new URL(
    //   "/api/test-openai-connection",
    //   request.url
    // ).toString();
    // const testResponse = await fetch(testUrl);
    // const testData = await testResponse.json();

    // if (!testData.success) {
    //   throw new Error(testData.error || "API key validation failed");
    // }

    // Generate prompt for website extraction with enhanced target audience guidance
    const prompt = `Extract brand information from this website: ${urlValidation.url}
    Please provide the following information in a valid JSON format:
    {
      "name": "Brand name",
      "industry": "Industry category",
      "description": "A detailed brand description of approximately 100 words.",
      "values": ["Core value 1", "Core value 2"],
      "targetAudience": {
        "demographic": {
          "age": "Age range (e.g., 25-45)",
          "occupation": "Common professional backgrounds",
          "location": "Primary geographic regions"
        },
        "interestsValues": ["Key interests", "Core values"],
        "context": ""A brief overview (~20 words) of typical customer context or use case.",
        "needsPainPoints": "Main challenges or needs (~30 words) faced by the audience."
      },
      "tone": "The brand's communication tone (e.g., friendly, professional, bold)",
      "competitors": ["Competitor 1", "Competitor 2"],
      "uniqueSellingPoints": ["USP 1", "USP 2"]
    }

    Requirements:
      - "description" must be approximately 100 words.
      - "needsPainPoints" and "context" combined should total ~50 words.
      - Response must be pure JSON. Do not include markdown, comments, or explanations.
    `;

    const result = await generateWithOpenAI(
      prompt,
      `You are a senior brand analyst. Always respond ONLY with valid JSON. 
      Ensure fields like "description" and "targetAudience" meet required word counts. 
      Use precise and informative language. Do not include explanations or any extra text.`
    );

    if (!result.success || !result.content) {
      throw new Error(result.error || "Failed to extract brand information");
    }

    // Parse and validate the response
    let brandDetails: BrandDetails;
    let processedDetails: ProcessedBrandDetails;
    try {
      brandDetails = JSON.parse(result.content) as BrandDetails;
      Logger.debug("Parsed brand details", { brandDetails });

      // Validate required fields
      const missingFields = REQUIRED_FIELDS.filter(
        (field) => !brandDetails[field]
      );
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Process target audience
      if (typeof brandDetails.targetAudience === "object") {
        const flattenedAudience = flattenTargetAudience(
          brandDetails.targetAudience as TargetAudienceDetail
        );
        processedDetails = {
          ...brandDetails,
          targetAudience: flattenedAudience,
          _rawTargetAudience:
            brandDetails.targetAudience as TargetAudienceDetail,
        };

        console.log("Processed details", processedDetails);
      } else {
        processedDetails = brandDetails as unknown as ProcessedBrandDetails;
      }

      // Validate target audience format
      // if (processedDetails.targetAudience.length < 10) {
      //   throw new Error(
      //     "Target audience description is too brief. Please provide more details."
      //   );
      // }
    } catch (parseError) {
      Logger.error(
        "Error parsing OpenAI response",
        parseError instanceof Error ? parseError : new Error()
      );
      throw new Error("Failed to parse brand information");
    }

    Logger.info("Successfully extracted brand information");
    return NextResponse.json({
      success: true,
      message: "Successfully extracted brand information",
      brandDetails: processedDetails,
    });
  } catch (error) {
    Logger.error(
      "Error in extract-website API",
      error instanceof Error ? error : new Error("Unknown error")
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to extract brand information",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
