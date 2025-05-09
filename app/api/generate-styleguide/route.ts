import { NextResponse } from "next/server";
import { processTemplate } from "@/lib/template-processor";

// Add validation function
function validateBrandDetails(details: any) {
  const errors: string[] = [];

  // Name validation
  if (!details.name || details.name.trim().length === 0) {
    errors.push("Brand name is required");
  } else if (details.name.length > 50) {
    errors.push("Brand name must be 50 characters or less");
  }

  // Description validation
  if (!details.description || details.description.trim().length === 0) {
    errors.push("Brand description is required");
  } else if (details.description.length > 500) {
    errors.push("Brand description must be 500 characters or less");
  }

  // Audience validation
  if (!details.audience) {
    errors.push("Target audience is required");
  } else if (details.audience.length > 500) {
    errors.push("Target audience must be 500 characters or less");
  }

  // Tone validation
  const validTones = [
    "friendly",
    "professional",
    "casual",
    "formal",
    "technical",
  ];
  if (!details.tone || !validTones.includes(details.tone)) {
    errors.push("Invalid tone selected");
  }

  return errors;
}

export async function POST(request: Request) {
  let brandDetails: any = {};
  let requestBody: any = {};

  try {
    console.log("Received request to generate-styleguide API");

    // First test the API key
    const testUrl = new URL(
      "/api/test-openai-connection",
      request.url
    ).toString();
    const testResponse = await fetch(testUrl);
    const testData = await testResponse.json();

    if (!testData.success) {
      throw new Error(testData.error || "API key validation failed");
    }

    // Get the request body and handle potential parsing errors
    try {
      requestBody = await request.json();
      console.log("Request body:", requestBody);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON in request body",
          error:
            parseError instanceof Error
              ? parseError.message
              : "JSON parse error",
        },
        { status: 400 }
      );
    }

    // Safely extract brandDetails with a default empty object if it doesn't exist
    brandDetails = requestBody?.brandInfo || requestBody?.brandDetails || {};
    console.log("Extracted brand details:", brandDetails);

    // Validate brand details
    const validationErrors = validateBrandDetails(brandDetails);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid brand details",
          error: validationErrors.join(", "),
        },
        { status: 400 }
      );
    }

    // Ensure tone is never empty
    if (!brandDetails.tone || brandDetails.tone.trim() === "") {
      brandDetails.tone = "professional";
      console.log("Using default tone: professional");
    }

    // Determine which template to use based on the plan
    const plan = requestBody?.plan || "core";
    console.log("Using plan:", plan);

    // Validate plan type
    if (!["core", "complete"].includes(plan)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid plan type",
          error: "Plan must be either 'core' or 'complete'",
        },
        { status: 400 }
      );
    }

    try {
      // Process the template with OpenAI
      console.log("Calling processTemplate with:", brandDetails, plan);
      const styleGuide = await processTemplate(
        plan === "complete" ? "complete_template" : "core_template",
        brandDetails,
        plan
      );

      if (!styleGuide || styleGuide.trim() === "") {
        throw new Error("Generated style guide is empty");
      }

      console.log(
        "Style guide generated successfully, length:",
        styleGuide.length
      );

      return NextResponse.json({
        success: true,
        message: "Style guide generated successfully",
        styleGuide,
      });
    } catch (templateError) {
      console.error(
        "Error processing template:",
        templateError,
        templateError instanceof Error ? templateError.stack : "No stack trace"
      );

      // Return error response
      return NextResponse.json(
        {
          success: false,
          message: "Error generating style guide",
          error:
            templateError instanceof Error
              ? templateError.message
              : "Unknown template processing error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(
      "Error in generate-styleguide API:",
      error,
      error instanceof Error ? error.stack : "No stack trace"
    );

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process request",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
