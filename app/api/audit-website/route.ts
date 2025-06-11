import { NextResponse } from "next/server"
import { validateUrl } from "@/lib/url-validation"
import { auditCopy } from "@/lib/copy-audit"
import * as cheerio from "cheerio"
import Logger from "@/lib/logger"

export async function POST(request: Request) {
  Logger.info("Received audit website request")

  try {
    const body = await request.json()
    
    if (!body.url) {
      return NextResponse.json(
        { success: false, message: "URL is required" },
        { status: 400 }
      )
    }

    // Validate URL
    let cleanUrl = body.url.trim().replace(/^['"\s]+|['"\s]+$/g, "")
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl
    }
    
    const urlValidation = validateUrl(cleanUrl)
    if (!urlValidation.isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid URL provided" },
        { status: 400 }
      )
    }

    // Fetch homepage
    const response = await fetch(urlValidation.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIStyleGuide/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    })
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    // Extract homepage content (skip nav, footer, ads)
    const title = $('title').text()
    
    // Remove navigation, footer, ads, and other non-content elements
    $('nav, footer, header, .nav, .navigation, .menu, .sidebar, .ads, .advertisement, script, style').remove()
    
    // Extract text content ONLY from paragraph and header tags
    const paragraphs: string[] = []
    
    // Look ONLY in actual paragraph and header tags
    $('p, h1, h2, h3, h4, h5, h6').each((_: unknown, el: any) => {
      const text = $(el).text().trim()
      
      // Only include substantial text content
      if (text.length > 20) {
        paragraphs.push(text)
      }
    })
    
    // Try to get main content areas (for other violation types)
    let mainContent = $('main').text() || 
                     $('article').text() || 
                     $('.content, .post-content, .entry-content').text() ||
                     $('body').text()
    
    mainContent = mainContent.replace(/\s+/g, ' ').trim()
    
    // Find subpages - enhanced for modern sites
    const subpageLinks: string[] = []
    const baseUrl = new URL(urlValidation.url)
    
    // Strategy 1: Traditional <a> links
    $('a').each((_: unknown, el: any) => {
      const href = $(el).attr('href') || ''
      
      // Skip obvious non-content links
      if (href.startsWith('#') || 
          href.startsWith('mailto:') || 
          href.startsWith('tel:') ||
          href.startsWith('javascript:') ||
          href.includes('facebook.com') ||
          href.includes('twitter.com') ||
          href.includes('instagram.com') ||
          href.includes('linkedin.com') ||
          href.includes('youtube.com')) {
        return
      }
      
      let fullUrl = href
      if (!/^https?:\/\//i.test(href)) {
        try {
          fullUrl = new URL(href, urlValidation.url).href
        } catch {
          return // Skip invalid URLs
        }
      }
      
      // Only include pages from the same domain
      try {
        const linkUrl = new URL(fullUrl)
        if (linkUrl.hostname !== baseUrl.hostname) {
          return // Skip external links
        }
        
        // Skip common non-content pages
        const path = linkUrl.pathname.toLowerCase()
        if (path.includes('/login') ||
            path.includes('/register') ||
            path.includes('/cart') ||
            path.includes('/checkout') ||
            path.includes('/search') ||
            path.includes('/contact-form') ||
            path === '/' ||
            path === '') {
          return
        }
        
        // Add unique internal links
        if (!subpageLinks.includes(fullUrl)) {
          subpageLinks.push(fullUrl)
        }
      } catch {
        return // Skip malformed URLs
      }
    })
    
    // Strategy 2: Common URL patterns (for sites with minimal links)
    if (subpageLinks.length < 2) {
      const commonPaths = [
        '/about', '/about-us', '/company', '/team',
        '/products', '/services', '/solutions', '/features',
        '/pricing', '/plans', '/contact', '/support',
        '/help', '/docs', '/documentation', '/blog',
        '/news', '/careers', '/jobs', '/investors'
      ]
      
      for (const path of commonPaths) {
        try {
          const testUrl = new URL(path, urlValidation.url).href
          // Quick HEAD request to check if page exists
          const headResponse = await fetch(testUrl, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(2000),
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIStyleGuide/1.0)' }
          })
          
          if (headResponse.ok && !subpageLinks.includes(testUrl)) {
            subpageLinks.push(testUrl)
            if (subpageLinks.length >= 5) break // Don't go overboard
          }
        } catch {
          // Page doesn't exist or timeout, continue
        }
      }
    }
    
    // Strategy 3: Look for data-href, data-url attributes (React/SPA patterns)
    if (subpageLinks.length < 2) {
      $('[data-href], [data-url], [data-link]').each((_: unknown, el: any) => {
        const dataHref = $(el).attr('data-href') || $(el).attr('data-url') || $(el).attr('data-link')
        if (dataHref && dataHref.startsWith('/') && !dataHref.startsWith('//')) {
          try {
            const fullUrl = new URL(dataHref, urlValidation.url).href
            if (!subpageLinks.includes(fullUrl)) {
              subpageLinks.push(fullUrl)
            }
          } catch {
            // Skip invalid URLs
          }
        }
      })
    }
    
    // Debug: Log what links we found
    Logger.debug("Found subpage links", { 
      url: urlValidation.url,
      totalLinks: subpageLinks.length,
      links: subpageLinks.slice(0, 5) // Show first 5
    })
    
    // Debug: Log homepage content sample
    Logger.debug("Homepage content sample", {
      url: urlValidation.url,
      paragraphCount: paragraphs.length,
      contentLength: mainContent.length,
      firstParagraph: paragraphs[0]?.slice(0, 100) || "No paragraphs found"
    })
    
    // Fetch up to 3 subpages
    const pagesToAudit = [
      {
        url: urlValidation.url,
        title: title,
        content: mainContent.slice(0, 3000), // Limit content for audit
        paragraphs: paragraphs.slice(0, 10)  // Limit to first 10 paragraphs
      }
    ]
    
    const subpagePromises = subpageLinks.slice(0, 3).map(async (subUrl) => {
      try {
        const subRes = await fetch(subUrl, { 
          signal: AbortSignal.timeout(5000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AIStyleGuide/1.0)',
          }
        })
                 const subHtml = await subRes.text()
         const $sub = cheerio.load(subHtml)
         const subTitle = $sub('title').text()
         
         // Clean subpage content too
         $sub('nav, footer, header, .nav, .navigation, .menu, .sidebar, .ads, .advertisement, script, style').remove()
         
         // Extract subpage paragraphs ONLY from paragraph and header tags
         const subParagraphs: string[] = []
         $sub('p, h1, h2, h3, h4, h5, h6').each((_: unknown, el: any) => {
           const text = $sub(el).text().trim()
           
           // Only include substantial text content
           if (text.length > 20) {
             subParagraphs.push(text)
           }
         })
         
         let subContent = $sub('main').text() || 
                         $sub('article').text() || 
                         $sub('.content, .post-content, .entry-content').text() ||
                         $sub('body').text()
         subContent = subContent.replace(/\s+/g, ' ').trim()
        
        return {
          url: subUrl,
          title: subTitle,
          content: subContent.slice(0, 3000),
          paragraphs: subParagraphs.slice(0, 10)
        }
      } catch (e) {
        Logger.debug(`Failed to fetch subpage ${subUrl}:`, e)
        return null
      }
    })
    
    const subpageResults = await Promise.all(subpagePromises)
    const validSubpages = subpageResults.filter(page => page !== null)
    pagesToAudit.push(...validSubpages)
    
    // Run the audit
    const auditResult = auditCopy(pagesToAudit)
    
    // Check if we got meaningful content
    const totalParagraphs = pagesToAudit.reduce((sum, page) => sum + page.paragraphs.length, 0)
    const totalContentLength = pagesToAudit.reduce((sum, page) => sum + page.content.length, 0)
    
    // Debug: Log audit details
    Logger.debug("Audit details", {
      url: urlValidation.url,
      pagesAudited: pagesToAudit.length,
      totalParagraphs,
      totalContentLength,
      violations: auditResult.summary.totalViolations,
      violationTypes: auditResult.summary.topIssues
    })
    
    // Detect if this might be a JavaScript app with minimal content
    if (totalParagraphs < 5 && totalContentLength < 1000) {
      Logger.info("Detected minimal content - likely JavaScript app", { 
        url: urlValidation.url,
        paragraphs: totalParagraphs,
        contentLength: totalContentLength
      })
      
      return NextResponse.json({
        success: false,
        message: "This appears to be a JavaScript application that loads content dynamically. Our crawler can only analyze server-side HTML content.",
        details: {
          issue: "javascript_app",
          suggestion: "Try auditing a traditional website with server-side content, or check individual pages that might have static content.",
          pagesScanned: auditResult.summary.pagesCrawled,
          contentFound: `${totalParagraphs} text blocks, ${totalContentLength} characters`
        }
      })
    }
    
    Logger.info("Successfully audited website", { 
      url: urlValidation.url,
      violations: auditResult.summary.totalViolations 
    })
    
    return NextResponse.json({
      success: true,
      message: `Found ${auditResult.summary.totalViolations} writing issues across ${auditResult.summary.pagesCrawled} pages`,
      audit: auditResult
    })
    
  } catch (error) {
    Logger.error("Error in audit-website API", error instanceof Error ? error : new Error("Unknown error"))
    
    return NextResponse.json(
      { success: false, message: "Failed to audit website" },
      { status: 500 }
    )
  }
} 