import { generateWithOpenAI } from "./openai"
import { processTemplate } from "./template-processor"

// Test function to verify OpenAI integration
export async function testOpenAIIntegration() {
  try {
    console.log("Testing OpenAI integration...")

    const result = await generateWithOpenAI(
      "Write a short paragraph about the importance of brand consistency.",
      "You are a brand strategist.",
    )

    if (result.success) {
      console.log("OpenAI integration test successful!")
      console.log("Response:", result.content)
      return true
    } else {
      console.error("OpenAI integration test failed:", result.error)
      return false
    }
  } catch (error) {
    console.error("Error testing OpenAI integration:", error)
    return false
  }
}

// Test function to verify template processing
export async function testTemplateProcessing() {
  try {
    console.log("Testing template processing...")

    const brandDetails = {
      name: "Test Brand",
      description: "A company that tests software",
      audience: "Developers and QA engineers",
      // tone field removed
    }

    const result = await processTemplate("style_guide", brandDetails, "core")

    console.log("Template processing test successful!")
    console.log("First 500 characters of result:", result.substring(0, 500) + "...")
    return true
  } catch (error) {
    console.error("Error testing template processing:", error)
    return false
  }
}

// Test utility for API diagnostics
export async function testStyleGuideAPI(brandDetails: any = null) {
  const testBrandDetails = brandDetails || {
    name: "Test Brand",
    description: "A test brand for debugging",
    audience: "developers",
    // tone field removed
  }

  try {
    console.log("Testing style guide API with:", testBrandDetails)

    const response = await fetch("/api/generate-styleguide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandInfo: testBrandDetails,
      }),
    })

    console.log("API Status:", response.status)

    try {
      const data = await response.json()
      console.log("API Response:", data)

      if (data.success) {
        console.log("Style guide length:", data.styleGuide?.length || 0)
        return {
          success: true,
          message: "API test successful",
          data,
        }
      } else {
        console.error("API returned error:", data.error)
        return {
          success: false,
          message: "API returned error",
          error: data.error,
          data,
        }
      }
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError)
      const text = await response.text()
      console.log("Raw response:", text.substring(0, 500) + "...")
      return {
        success: false,
        message: "Failed to parse JSON response",
        error: jsonError instanceof Error ? jsonError.message : "Unknown JSON parsing error",
        rawResponse: text.substring(0, 500) + "...",
      }
    }
  } catch (error) {
    console.error("Error testing API:", error)
    return {
      success: false,
      message: "Error testing API",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
