import { NextResponse } from "next/server"
import { generateWithOpenAI } from "@/lib/openai"
import Logger from "@/lib/logger"
import { validateUrl } from "@/lib/url-validation"
import * as cheerio from "cheerio"

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

    // Sanitize and validate the URL
    let cleanUrl = body.url.trim().replace(/^['"\s]+|['"\s]+$/g, "")
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl
    }
    // Validate again after cleaning
    const urlValidation = validateUrl(cleanUrl)
    if (!urlValidation.isValid) {
      Logger.error("Invalid URL provided after cleaning", new Error(urlValidation.error))
      return NextResponse.json(
        {
          success: false,
          message: "Invalid URL provided. Please check for typos or extra punctuation.",
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
    let html = await siteResponse.text()

    // Use cheerio to extract key info from homepage
    const $ = cheerio.load(html)
    const title = $('title').text()
    const metaDesc = $('meta[name="description"]').attr('content') || ''
    const h1 = $('h1').first().text()
    const h2 = $('h2').first().text()
    // Try to get main content (simple: first <main>, fallback: body text)
    let mainContent = $('main').text() || $('body').text()
    mainContent = mainContent.replace(/\s+/g, ' ').trim().slice(0, 2000)

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
    for (const subUrl of subpagesToCrawl) {
      try {
        const subRes = await fetch(subUrl)
        const subHtml = await subRes.text()
        const $sub = cheerio.load(subHtml)
        const subTitle = $sub('title').text()
        const subMeta = $sub('meta[name="description"]').attr('content') || ''
        const subH1 = $sub('h1').first().text()
        const subH2 = $sub('h2').first().text()
        let subMain = $sub('main').text() || $sub('body').text()
        subMain = subMain.replace(/\s+/g, ' ').trim().slice(0, 2000)
        subpageText += `\n[Subpage: ${subUrl}]\n${subTitle}\n${subMeta}\n${subH1}\n${subH2}\n${subMain}`
      } catch (e) { /* skip errors */ }
    }

    // Combine all extracted text
    let summary = [title, metaDesc, h1, h2, mainContent, subpageText].filter(Boolean).join('\n')
    // Truncate to 20k chars
    summary = summary.slice(0, 20000)

    // Generate prompt for website extraction with improved guidance
    const prompt = `Analyze the following website content and extract the brand's core identity.

Write a single, cohesive paragraph (30-50 words) that follows this structure:
1. Start with the brand name followed by what they are/do
2. Include their main products/services
3. Specify their target audience
4. Mention what makes them unique (if identifiable)

Your paragraph should be:
- Professional, clear and easy to read 
- Factual, not promotional
- Written in third person
- Focused on their current offerings, not history
- Use short sentences and simple punctuation

Example: 'Nike is a leading sports brand, selling a wide range of workout products, services and experiences worldwide. Nike targets athletes and sports enthusiasts globally, focusing on those who want high-quality sportswear and equipment.'

Website Content:
${summary}
`

    const result = await generateWithOpenAI(
      prompt,
      "You are an expert brand analyst with experience writing clear, readable brand summaries. Use simple language and short sentences. Avoid complex words, marketing jargon, and run-on sentences. Make your description easily scannable and accessible to all readers."
    )

    if (!result.success || !result.content) {
      throw new Error(result.error || "Failed to extract brand information")
    }

    // Process the paragraph response
    const brandDetailsText = result.content.trim()
    Logger.debug("Generated brand details text", { brandDetailsText })

    Logger.info("Successfully extracted brand information")
    return NextResponse.json({
      success: true,
      message: "Successfully extracted brand information",
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
