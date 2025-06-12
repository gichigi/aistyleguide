import { NextResponse } from "next/server"
import { validateUrl } from "@/lib/url-validation"
import * as cheerio from "cheerio"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    if (!body.url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 })
    }

    // Validate URL
    let cleanUrl = body.url.trim()
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl
    }
    
    const urlValidation = validateUrl(cleanUrl)
    if (!urlValidation.isValid) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    // Fetch the page
    const response = await fetch(urlValidation.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIStyleGuide/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    })
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    // Extract different types of content
    const analysis = {
      url: urlValidation.url,
      htmlLength: html.length,
      title: $('title').text(),
      
      // Count different element types
      elementCounts: {
        p: $('p').length,
        div: $('div').length,
        span: $('span').length,
        section: $('section').length,
        article: $('article').length,
        h1: $('h1').length,
        h2: $('h2').length,
        h3: $('h3').length,
      },
      
      // Sample content from different elements
      sampleContent: {
        paragraphs: $('p').slice(0, 3).map((_, el) => $(el).text().trim()).get(),
        divs: $('div').slice(0, 5).map((_, el) => {
          const text = $(el).text().trim()
          return text.length > 20 && text.length < 200 ? text : null
        }).get().filter(Boolean),
        spans: $('span').slice(0, 5).map((_, el) => {
          const text = $(el).text().trim()
          return text.length > 20 && text.length < 200 ? text : null
        }).get().filter(Boolean),
        headings: $('h1, h2, h3').slice(0, 5).map((_, el) => $(el).text().trim()).get(),
      },
      
      // Raw HTML sample (first 1000 chars)
      htmlSample: html.slice(0, 1000),
      
      // Body text sample
      bodyText: $('body').text().replace(/\s+/g, ' ').trim().slice(0, 500)
    }
    
    return NextResponse.json(analysis)
    
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
} 