import { 
  testOpenAIIntegration, 
  testTemplateProcessing, 
  testStyleGuideAPI,
  testDescriptionCharacterLimits,
  testInputDetectionAndRouting,
  testBrandNameGeneration
} from './lib/test-utils'

async function runTests() {
  console.log('🧪 Starting tests...\n')

  // Test 1: OpenAI Integration
  console.log('Test 1: OpenAI Integration')
  const openAIResult = await testOpenAIIntegration()
  console.log('Result:', openAIResult ? '✅ PASS' : '❌ FAIL', '\n')

  // Test 2: Template Processing
  console.log('Test 2: Template Processing')
  const templateResult = await testTemplateProcessing()
  console.log('Result:', templateResult ? '✅ PASS' : '❌ FAIL', '\n')

  // Test 3: Style Guide API with different test cases
  console.log('Test 3: Style Guide API')
  
  const testCases = [
    {
      name: "Basic brand",
      details: {
        name: "Test Brand",
        description: "A test brand for debugging",
        audience: "developers",
        tone: "professional"
      }
    },
    {
      name: "Complex audience",
      details: {
        name: "Second Brand",
        description: "Another test brand",
        audience: "marketing professionals aged 25-45 who are interested in branding, content creation, and digital marketing",
        tone: "friendly"
      }
    }
  ]

  for (const testCase of testCases) {
    console.log(`\nTesting with ${testCase.name}:`)
    const apiResult = await testStyleGuideAPI(testCase.details)
    console.log('Result:', apiResult.success ? '✅ PASS' : '❌ FAIL')
    if (!apiResult.success) {
      console.log('Error:', apiResult.error)
    }
  }

  console.log('\n=== NEW CRITICAL TESTS FOR DESCRIPTION-BASED GENERATION ===\n')

  // Test 4: Description Character Limits
  console.log('Test 4: Description Character Limits')
  const charLimitResult = await testDescriptionCharacterLimits()
  console.log('Result:', charLimitResult ? '✅ PASS' : '❌ FAIL', '\n')

  // Test 5: Input Detection and API Routing  
  console.log('Test 5: Input Detection and API Routing')
  const inputDetectionResult = await testInputDetectionAndRouting()
  console.log('Result:', inputDetectionResult ? '✅ PASS' : '❌ FAIL', '\n')

  // Test 6: Brand Name Generation
  console.log('Test 6: Brand Name Generation')
  const brandNameResult = await testBrandNameGeneration()
  console.log('Result:', brandNameResult ? '✅ PASS' : '❌ FAIL', '\n')

  // Summary
  const allNewTestsPassed = charLimitResult && inputDetectionResult && brandNameResult
  console.log('=== CRITICAL TESTS SUMMARY ===')
  console.log('Character Limits:', charLimitResult ? '✅' : '❌')
  console.log('Input Detection:', inputDetectionResult ? '✅' : '❌') 
  console.log('Brand Name Gen:', brandNameResult ? '✅' : '❌')
  console.log('Overall Status:', allNewTestsPassed ? '🎉 ALL PASS' : '⚠️  SOME FAILED')

  console.log('\n🏁 Tests completed!')
}

runTests().catch(console.error) 