import { NextResponse } from "next/server"
import { generateWithOpenAI, generateBrandDescription } from "@/lib/openai"
import Logger from "@/lib/logger"
import { validateUrl } from "@/lib/url-validation"
import * as cheerio from "cheerio"
import OpenAI from "openai"

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

// Test OpenAI connection inline
async function testOpenAIConnection() {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("OpenAI API key not found")
    }

    const openai = new OpenAI({ apiKey })
    
    // Simple test call with faster model
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Test" }],
      max_tokens: 5,
    })

    if (!response.choices?.[0]?.message) {
      throw new Error("Invalid OpenAI response")
    }

    return { success: true }
  } catch (error) {
    console.error("OpenAI test failed:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "OpenAI connection failed" 
    }
  }
}

export async function POST(request: Request) {
  Logger.info("Received extract website request")

  try {
    // Parse request body
    const body = await request.json()
    Logger.debug("Request body", { body })

    // Handle both URL and description inputs
    if (!body.url && !body.description) {
      Logger.error("Missing URL or description in request")
      return NextResponse.json(
        {
          success: false,
          message: "URL or description is required",
          error: "Missing required field: url or description",
        },
        { status: 400 }
      )
    }

    // If description is provided, generate expanded brand details
    if (body.description) {
      Logger.info("Processing description input")
      
      const cleanDescription = body.description.trim()
      if (cleanDescription.length < 25) {
        return NextResponse.json(
          {
            success: false,
            message: "Description too short",
            error: "Please provide at least 5 words",
          },
          { status: 400 }
        )
      }

      // Test OpenAI connection
      const testResult = await testOpenAIConnection()
      if (!testResult.success) {
        throw new Error(testResult.error || "API key validation failed")
      }

      // Generate expanded brand description
      const result = await generateBrandDescription(cleanDescription)
      
      if (!result.success || !result.content) {
        throw new Error(result.error || "Failed to generate brand description")
      }

      // Parse the JSON response
      let expandedData
      try {
        expandedData = JSON.parse(result.content)
      } catch (parseError) {
        Logger.error("Failed to parse JSON response", parseError instanceof Error ? parseError : new Error("Parse error"))
        expandedData = {
          brandName: "",
          description: result.content.trim()
        }
      }

      const brandName = expandedData.brandName || ""
      const brandDetailsText = expandedData.description || result.content.trim()
      
      Logger.info("Successfully generated brand description")
      return NextResponse.json({
        success: true,
        message: "Successfully generated brand description",
        brandName,
        brandDetailsText,
      })
    }

    // Original URL processing logic
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

    // Sanitize and validate the URL
    let cleanUrl = body.url.trim().replace(/^['"\s]+|['"\s]+$/g, "")
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl
    }

    // Check for common example/test domains that should be rejected early
    const hostname = new URL(cleanUrl).hostname.toLowerCase()
    const testDomains = [
      'example.com', 'example.org', 'example.net',
      'test.com', 'test.org', 'test.net',
      'localhost', '127.0.0.1',
      'httpbin.org' // Popular testing service
    ]
    
    if (testDomains.includes(hostname)) {
      Logger.info("Test/example domain detected", { url: cleanUrl, hostname })
      return NextResponse.json({
        success: false,
        message: "This appears to be a test or example domain. Please enter a real website URL.",
        error: "test domain"
      }, { status: 400 })
    }
    // Validate again after cleaning
    const urlValidation = validateUrl(cleanUrl)
    if (!urlValidation.isValid) {
      Logger.error("Invalid URL provided after cleaning", new Error(urlValidation.error))
      
      // Check if it's a domain issue
      if (urlValidation.error?.includes('domain') || urlValidation.error?.includes('hostname')) {
        return NextResponse.json(
          {
            success: false,
            message: "We can't access this type of website. Please enter details manually.",
            error: "unsupported domain",
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        {
          success: false,
                      message: "Please check the URL format (e.g., yoursite.com or https://yoursite.com)",
          error: "malformed URL",
        },
        { status: 400 }
      )
    }

    // Test OpenAI connection inline
    const testResult = await testOpenAIConnection()
    if (!testResult.success) {
      throw new Error(testResult.error || "API key validation failed")
    }

    // Fetch the website HTML with better error handling
    let siteResponse
    let html
    try {
      siteResponse = await fetch(urlValidation.url, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      })

      // Check for HTTP errors
      if (!siteResponse.ok) {
        if (siteResponse.status === 401 || siteResponse.status === 403) {
          return NextResponse.json({
            success: false,
            message: "This page requires login. Please enter your brand details manually.",
            error: "authentication required"
          }, { status: 400 })
        }
        
        if (siteResponse.status === 404) {
                   return NextResponse.json({
           success: false,
           message: "Page not found. Please check the URL or try a different page.",
           error: "page not found"
         }, { status: 400 })
        }

        throw new Error(`HTTP ${siteResponse.status}: ${siteResponse.statusText}`)
      }

      html = await siteResponse.text()
      
      // Check for minimal content (possible JS app)
      if (html.length < 500) {
        return NextResponse.json({
          success: false,
          message: "This site loads content dynamically. Please enter your brand details manually.",
          error: "javascript site"
        }, { status: 400 })
      }

    } catch (fetchError) {
      Logger.error("Fetch error", fetchError instanceof Error ? fetchError : new Error("Fetch error"))
      
      // Classify fetch errors for better UX
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          return NextResponse.json({
            success: false,
            message: "Website took too long to respond. Try again or enter details manually.",
            error: "timeout"
          }, { status: 408 })
        }
        
        if (fetchError.message.includes('SSL') || fetchError.message.includes('certificate') || fetchError.message.includes('CERT')) {
          return NextResponse.json({
            success: false,
            message: "This website has security issues. Try entering details manually.",
            error: "SSL certificate error"
          }, { status: 400 })
        }
        
        if (fetchError.message.includes('getaddrinfo') || fetchError.message.includes('DNS')) {
          return NextResponse.json({
            success: false,
            message: "Can't reach this website. Check the URL or try again later.",
            error: "DNS error"
          }, { status: 400 })
        }
      }
      
      return NextResponse.json({
        success: false,
        message: "Can't reach this website. Check the URL or try again later.",
        error: fetchError instanceof Error ? fetchError.message : "network error"
      }, { status: 400 })
    }
    
    // Debug: Log what we actually got
    Logger.debug("Fetched HTML preview", { 
      url: urlValidation.url,
      htmlPreview: html.slice(0, 500),
      contentLength: html.length 
    })

    // Use cheerio to extract key info from homepage
    const $ = cheerio.load(html)
    const title = $('title').text()
    const metaDesc = $('meta[name="description"]').attr('content') || ''
    const h1 = $('h1').first().text()
    const h2 = $('h2').first().text()
    // Try to get main content (simple: first <main>, fallback: body text)
    let mainContent = $('main').text() || $('body').text()
    mainContent = mainContent.replace(/\s+/g, ' ').trim().slice(0, 2000)

    // Debug: Log extracted content
    Logger.debug("Extracted content", { 
      title, 
      metaDesc, 
      h1, 
      h2, 
      mainContentPreview: mainContent.slice(0, 200) 
    })

    // Find links to About, Company, Team pages
    const subpageLinks: string[] = []
    $('a').each((_: unknown, el: any) => {
      const href = $(el).attr('href') || ''
      if (/about|company|team/i.test(href) && !href.startsWith('#') && !href.startsWith('mailto:')) {
        let url = href
        if (!/^https?:\/\//i.test(url)) {
          url = new URL(url, urlValidation.url).href
        }
        if (!subpageLinks.includes(url)) subpageLinks.push(url)
      }
    })
    // Limit to 2 subpages
    const subpagesToCrawl = subpageLinks.slice(0, 2)
    let subpageText = ''
    
    // Fetch subpages in parallel for better performance
    if (subpagesToCrawl.length > 0) {
      const subpagePromises = subpagesToCrawl.map(async (subUrl) => {
        try {
          const subRes = await fetch(subUrl, { 
            signal: AbortSignal.timeout(5000), // 5 second timeout
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate, br',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
            }
          })
          const subHtml = await subRes.text()
          const $sub = cheerio.load(subHtml)
          const subTitle = $sub('title').text()
          const subMeta = $sub('meta[name="description"]').attr('content') || ''
          const subH1 = $sub('h1').first().text()
          const subH2 = $sub('h2').first().text()
          let subMain = $sub('main').text() || $sub('body').text()
          subMain = subMain.replace(/\s+/g, ' ').trim().slice(0, 2000)
          return `\n[Subpage: ${subUrl}]\n${subTitle}\n${subMeta}\n${subH1}\n${subH2}\n${subMain}`
        } catch (e) { 
          console.log(`Failed to fetch subpage ${subUrl}:`, e)
          return '' // Return empty string on error
        }
      })
      
      // Wait for all subpage fetches to complete
      const subpageResults = await Promise.all(subpagePromises)
      subpageText = subpageResults.join('')
    }

    // Combine all extracted text
    let summary = [title, metaDesc, h1, h2, mainContent, subpageText].filter(Boolean).join('\n')
    // Reduce to 10k chars for faster processing
    summary = summary.slice(0, 10000)

    // Check for insufficient content
    const meaningfulContent = summary.replace(/\s+/g, ' ').trim()
    
    // Debug: Log content analysis
    Logger.debug("Content analysis", { 
      url: urlValidation.url,
      totalLength: meaningfulContent.length,
      contentPreview: meaningfulContent.slice(0, 200) + '...',
      hasTitle: !!title,
      hasDescription: !!metaDesc,
      hasH1: !!h1,
      mainContentLength: mainContent.length
    })
    
    // Detect common placeholder/example sites
    const lowerContent = meaningfulContent.toLowerCase()
    const lowerTitle = title.toLowerCase()
    const isPlaceholderSite = (
      // Example domains
      lowerTitle.includes('example') ||
      lowerTitle.includes('placeholder') ||
      lowerTitle.includes('test page') ||
      lowerTitle.includes('demo') ||
      // Common placeholder content
      lowerContent.includes('this domain is for use in illustrative examples') ||
      lowerContent.includes('this domain is established to be used for illustrative examples') ||
      lowerContent.includes('lorem ipsum') ||
      lowerContent.includes('sample website') ||
      lowerContent.includes('coming soon') ||
      lowerContent.includes('under construction') ||
      lowerContent.includes('placeholder text') ||
      // Test/development indicators
      lowerContent.includes('test site') ||
      lowerContent.includes('development site') ||
      lowerContent.includes('staging site') ||
      // Minimal/generic content patterns
      (lowerContent.includes('example') && lowerContent.includes('domain') && meaningfulContent.length < 500)
    )
    
    // More strict content requirements
    if (meaningfulContent.length < 200 || isPlaceholderSite) {
      Logger.info("Insufficient content detected", {
        url: urlValidation.url,
        contentLength: meaningfulContent.length,
        isPlaceholder: isPlaceholderSite,
        title
      })
      
      return NextResponse.json({
        success: false,
        message: "We couldn't find enough content on this site. Please enter more details manually.",
        error: "insufficient content"
      }, { status: 400 })
    }

    // Generate prompt for website extraction with improved guidance
    const prompt = `Analyze the following website content and extract the brand's core identity.

Return a JSON object with two fields:
1. "brandName": The exact name of the company/brand (just the name, nothing else)
2. "description": A single, cohesive paragraph (30-50 words) that follows this structure:
   - Start with the brand name followed by what they are/do
   - Include their main products/services
   - Specify their target audience
   - Mention what makes them unique (if identifiable)

Your description should be:
- Professional, clear and easy to read 
- Factual, not promotional
- Written in third person
- Focused on their current offerings, not history
- Use short sentences and simple punctuation

Examples: 
{
  "brandName": "Nike",
  "description": "Nike is a leading sports brand, selling a wide range of workout products, services and experiences worldwide. Nike targets athletes and sports enthusiasts globally, focusing on those who want high-quality sportswear and equipment."
}

{
  "brandName": "OpenAI", 
  "description": "OpenAI is a technology company specializing in artificial intelligence research and development. OpenAI offers cutting-edge AI products and services to businesses and developers worldwide. Their target audience includes organizations looking to leverage advanced AI solutions."
}

Website Content:
${summary}
`

    const result = await generateWithOpenAI(
      prompt,
      "You are an expert brand analyst with experience writing clear, readable brand summaries. Use simple language and short sentences. Avoid complex words, marketing jargon, and run-on sentences. Make your description easily scannable and accessible to all readers. Always return valid JSON.",
      "json", // Use json format to ensure proper JSON response
      500 // Reduce max tokens since we only need a short paragraph
    )

    if (!result.success || !result.content) {
      throw new Error(result.error || "Failed to extract brand information")
    }

    // Parse the JSON response
    let extractedData
    try {
      extractedData = JSON.parse(result.content)
    } catch (parseError) {
      Logger.error("Failed to parse JSON response", parseError instanceof Error ? parseError : new Error("Parse error"))
      // Fallback: treat content as description only
      extractedData = {
        brandName: "",
        description: result.content.trim()
      }
    }

    const brandName = extractedData.brandName || ""
    const brandDetailsText = extractedData.description || result.content.trim()
    
    Logger.debug("Generated brand details", { brandName, brandDetailsText })

    Logger.info("Successfully extracted brand information")
    return NextResponse.json({
      success: true,
      message: "Successfully extracted brand information",
      brandName,
      brandDetailsText,
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
