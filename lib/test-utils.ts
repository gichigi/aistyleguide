import { generateWithOpenAI } from "./openai"
import { processTemplate } from "./template-processor"
import { validateInput, detectInputType } from "./input-utils"

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
      tone: "Technical but friendly",
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
    tone: "professional",
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

// Test 1: Character Limit Compliance for Description Generation
export async function testDescriptionCharacterLimits() {
  console.log("Testing description character limit compliance...")
  
  const testCases = [
    { name: "Regular", description: "A marketing agency that helps small businesses grow their online presence" },
    { name: "Weird", description: "A subscription service that delivers mystery vintage objects from estate sales" },
    { name: "Long", description: "A comprehensive wellness platform that combines personalized nutrition planning, mindfulness coaching, fitness tracking, and mental health support to help busy professionals achieve work-life balance while maintaining peak performance" },
    { name: "Short", description: "Dog walking app" }
  ]
  
  let allPassed = true
  
  for (const testCase of testCases) {
    try {
      console.log(`\n  Testing ${testCase.name} case: "${testCase.description.substring(0, 50)}..."`)
      
      const response = await fetch("http://localhost:3002/api/extract-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: testCase.description }),
      })
      
      const data = await response.json()
      
      if (data.success && data.brandDetailsText) {
        const length = data.brandDetailsText.length
        console.log(`    Generated description length: ${length} chars`)
        
        // Check if within acceptable range (300-500 chars for form validation)
        const withinRange = length >= 300 && length <= 500
        const result = withinRange ? '✅ PASS' : '❌ FAIL'
        console.log(`    Character limit validation: ${result}`)
        
        if (!withinRange) {
          console.log(`    ERROR: Description length ${length} is outside 300-500 character range`)
          allPassed = false
        }
      } else {
        console.log(`    ❌ FAIL: API call failed - ${data.error || 'Unknown error'}`)
        allPassed = false
      }
    } catch (error) {
      console.log(`    ❌ FAIL: Exception - ${error instanceof Error ? error.message : 'Unknown error'}`)
      allPassed = false
    }
  }
  
  return allPassed
}

// Test 2: Input Type Detection and API Routing
export async function testInputDetectionAndRouting() {
  console.log("Testing input detection and API routing...")
  
  const testCases = [
    { input: "https://example.com", expectedType: "url", description: "URL input" },
    { input: "example.com", expectedType: "url", description: "Domain input" },  
    { input: "A tech startup that builds mobile apps", expectedType: "description", description: "Description input" },
    { input: "Short text", expectedType: "description", description: "Short description" },
    { input: "", expectedType: "empty", description: "Empty input" }
  ]
  
  let allPassed = true
  
  for (const testCase of testCases) {
    try {
      console.log(`\n  Testing ${testCase.description}: "${testCase.input}"`)
      
      // Test input detection
      const detection = detectInputType(testCase.input)
      const detectionMatch = detection.inputType === testCase.expectedType
      console.log(`    Input detection: ${detection.inputType} (expected: ${testCase.expectedType}) ${detectionMatch ? '✅' : '❌'}`)
      
      if (!detectionMatch) {
        allPassed = false
        continue
      }
      
      // Test validation
      const validation = validateInput(testCase.input)
      console.log(`    Validation result: ${validation.isValid ? 'valid' : 'invalid'} - ${validation.error || 'no error'}`)
      
      // For valid URL and description inputs, test API routing
      if (validation.isValid && (testCase.expectedType === 'url' || testCase.expectedType === 'description')) {
        const apiBody = testCase.expectedType === 'url' 
          ? { url: validation.cleanInput }
          : { description: validation.cleanInput }
          
        console.log(`    Testing API routing with ${testCase.expectedType} parameter...`)
        
        const response = await fetch("http://localhost:3002/api/extract-website", {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiBody),
        })
        
        const apiSuccess = response.ok
        console.log(`    API routing: ${apiSuccess ? '✅ PASS' : '❌ FAIL'}`)
        
        if (!apiSuccess) {
          allPassed = false
        }
      }
      
    } catch (error) {
      console.log(`    ❌ FAIL: Exception - ${error instanceof Error ? error.message : 'Unknown error'}`)
      allPassed = false
    }
  }
  
  return allPassed
}

// Test 3: Brand Name Generation and Fallback
export async function testBrandNameGeneration() {
  console.log("Testing brand name generation...")
  
  const testCases = [
    { 
      description: "A dog walking service for professionals",
      shouldGenerate: true,
      testName: "Unnamed service"
    },
    { 
      description: "Nike creates athletic footwear and apparel", 
      shouldGenerate: false,
      expectedName: "Nike",
      testName: "Named brand (Nike)"
    },
    {
      description: "Very short app",
      shouldGenerate: true, 
      testName: "Minimal description"
    }
  ]
  
  let allPassed = true
  
  for (const testCase of testCases) {
    try {
      console.log(`\n  Testing ${testCase.testName}: "${testCase.description}"`)
      
      const response = await fetch("http://localhost:3002/api/extract-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: testCase.description }),
      })
      
      const data = await response.json()
      
      if (data.success && data.brandName) {
        const brandName = data.brandName
        console.log(`    Generated brand name: "${brandName}"`)
        
        // Check if brand name exists and is meaningful
        const hasValidName = brandName && brandName.length > 2
        console.log(`    Has valid name: ${hasValidName ? '✅' : '❌'}`)
        
        if (!hasValidName) {
          allPassed = false
          continue
        }
        
        // Check for generic names to avoid
        const genericNames = ['App', 'Service', 'Company', 'Business', 'Brand']
        const isGeneric = genericNames.includes(brandName.trim())
        console.log(`    Avoids generic names: ${!isGeneric ? '✅' : '❌'}`)
        
        if (isGeneric) {
          allPassed = false
        }
        
        // Check expected name if provided
        if (testCase.expectedName) {
          const containsExpectedName = brandName.toLowerCase().includes(testCase.expectedName.toLowerCase())
          console.log(`    Contains expected name "${testCase.expectedName}": ${containsExpectedName ? '✅' : '❌'}`)
          
          if (!containsExpectedName) {
            allPassed = false
          }
        }
        
      } else {
        console.log(`    ❌ FAIL: API call failed or no brand name - ${data.error || 'Unknown error'}`)
        allPassed = false
      }
    } catch (error) {
      console.log(`    ❌ FAIL: Exception - ${error instanceof Error ? error.message : 'Unknown error'}`)
      allPassed = false
    }
  }
  
  return allPassed
}
