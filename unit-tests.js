// Simple unit tests for critical pure functions
// Inline functions for testing (copied from lib/input-utils.ts)

function detectInputType(input) {
  const trimmed = input?.trim() || ''
  
  if (!trimmed) {
    return { inputType: 'empty', cleanInput: '' }
  }
  
  // Check if it looks like a URL
  const urlPatterns = [
    /^https?:\/\//i,  // starts with http(s)://
    /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,})/,  // domain.tld pattern
    /^www\./i  // starts with www.
  ]
  
  const isUrl = urlPatterns.some(pattern => pattern.test(trimmed))
  
  if (isUrl) {
    return { inputType: 'url', cleanInput: trimmed }
  }
  
  return { inputType: 'description', cleanInput: trimmed }
}

function validateInput(input) {
  const detection = detectInputType(input)
  
  if (detection.inputType === 'empty') {
    return {
      isValid: false,
      cleanInput: detection.cleanInput,
      inputType: 'empty',
      error: "Enter a website URL or brand description"
    }
  }
  
  if (detection.inputType === 'url') {
    try {
      let urlToCheck = detection.cleanInput
      if (!urlToCheck.match(/^https?:\/\//)) {
        urlToCheck = `https://${urlToCheck}`
      }
      
      const url = new URL(urlToCheck)
      
      if (!url.hostname || url.hostname === 'localhost') {
        throw new Error("Invalid URL")
      }
      
      if (!url.hostname.includes('.') || url.hostname.includes('..') || 
          url.hostname.startsWith('.') || url.hostname.endsWith('.')) {
        throw new Error("Invalid domain format")
      }
      
      return {
        isValid: true,
        cleanInput: url.toString(),
        inputType: 'url'
      }
    } catch (error) {
      return {
        isValid: false,
        cleanInput: detection.cleanInput,
        inputType: 'url',
        error: "Enter a valid URL (e.g., example.com)"
      }
    }
  }
  
  // Description validation
  if (detection.cleanInput.length < 25) {
    return {
      isValid: false,
      cleanInput: detection.cleanInput,
      inputType: 'description',
      error: "Description must be at least 25 characters"
    }
  }
  
  if (detection.cleanInput.length > 500) {
    return {
      isValid: false,
      cleanInput: detection.cleanInput,
      inputType: 'description',
      error: "Description must be under 500 characters"
    }
  }
  
  return {
    isValid: true,
    cleanInput: detection.cleanInput,
    inputType: 'description'
  }
}

// Simple test runner
function assertEquals(actual, expected, testName) {
  if (actual === expected) {
    console.log(`✅ ${testName}`)
  } else {
    console.log(`❌ ${testName} - Expected: ${expected}, Got: ${actual}`)
    return false
  }
  return true
}

function assertTrue(condition, testName) {
  if (condition) {
    console.log(`✅ ${testName}`)
  } else {
    console.log(`❌ ${testName} - Expected true, got false`)
    return false
  }
  return true
}

function runUnitTests() {
  console.log('🧪 Running Unit Tests for Critical Functions\n')
  
  let allPassed = true

  // Test 1: Input Type Detection
  console.log('Test 1: Input Type Detection')
  allPassed &= assertEquals(detectInputType('https://example.com').inputType, 'url', 'Detects HTTPS URL')
  allPassed &= assertEquals(detectInputType('example.com').inputType, 'url', 'Detects domain URL')
  allPassed &= assertEquals(detectInputType('A marketing agency for small businesses').inputType, 'description', 'Detects description')
  allPassed &= assertEquals(detectInputType('').inputType, 'empty', 'Detects empty input')
  allPassed &= assertEquals(detectInputType('   ').inputType, 'empty', 'Detects whitespace as empty')
  
  // Test 2: Input Validation Logic
  console.log('\nTest 2: Input Validation Logic')
  const validUrl = validateInput('https://google.com')
  allPassed &= assertTrue(validUrl.isValid, 'Valid URL passes validation')
  allPassed &= assertEquals(validUrl.inputType, 'url', 'Valid URL has correct type')
  
  const invalidUrl = validateInput('localhost')
  allPassed &= assertTrue(!invalidUrl.isValid, 'Localhost URL fails validation')
  allPassed &= assertTrue(!!invalidUrl.error, 'Invalid URL has error message')
  
  const validDesc = validateInput('A marketing agency that helps small businesses grow their online presence')
  allPassed &= assertTrue(validDesc.isValid, 'Valid description passes validation')
  allPassed &= assertEquals(validDesc.inputType, 'description', 'Valid description has correct type')
  
  const shortDesc = validateInput('short')
  allPassed &= assertTrue(!shortDesc.isValid, 'Short description fails validation')
  
  // Test 3: Character Length Logic
  console.log('\nTest 3: Character Length Validation')
  
  // Test description length requirements
  const minLengthDesc = 'A'.repeat(25) // Minimum valid length
  const maxLengthDesc = 'A'.repeat(500) // Maximum valid length  
  const tooLongDesc = 'A'.repeat(501) // Too long
  
  allPassed &= assertTrue(validateInput(minLengthDesc).isValid, '25 char description is valid')
  allPassed &= assertTrue(validateInput(maxLengthDesc).isValid, '500 char description is valid')
  allPassed &= assertTrue(!validateInput(tooLongDesc).isValid, '501+ char description is invalid')
  
  // URL validation edge cases
  allPassed &= assertTrue(!validateInput('invalid..domain.com').isValid, 'Double dot domain fails')
  allPassed &= assertTrue(!validateInput('.invalid.com').isValid, 'Leading dot domain fails')
  allPassed &= assertTrue(!validateInput('invalid.').isValid, 'Trailing dot domain fails')
  
  console.log('\n=== Test Summary ===')
  if (allPassed) {
    console.log('🎉 All unit tests PASSED!')
  } else {
    console.log('⚠️  Some unit tests FAILED!')
  }
  
  return allPassed
}

// Run tests
runUnitTests()
