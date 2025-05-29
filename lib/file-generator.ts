// File generation utilities for style guide exports
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { generatePDF } from "./pdf-utils"
import TurndownService from 'turndown'

export type FileFormat = "pdf" | "md" | "docx" | "html"

/**
 * Generate a file in the specified format with the given content
 */
export async function generateFile(format: FileFormat, content: string, brandName: string): Promise<Blob> {
  try {
  switch (format) {
    case "pdf":
      return generatePDF(content, brandName)
    case "md":
      return generateMarkdown(content)
    case "docx":
      return generateDOCX(content, brandName)
    case "html":
      return generateHTML(content, brandName)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
  } catch (error) {
    console.error('[File Generator] File generation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      format,
      brandName,
      contentLength: content.length
    })
    const formatName = format.toUpperCase()
    throw new Error(`Failed to generate ${formatName} file. Please try again or contact support.`)
  }
}

/**
 * Generate a properly formatted Markdown document
 */
function generateMarkdown(content: string): Promise<Blob> {
  try {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced'
    })
    
    // Convert HTML to clean markdown
    const markdown = turndownService.turndown(content)
    
    return Promise.resolve(new Blob([markdown], { type: "text/markdown" }))
  } catch (error) {
    console.error('[File Generator] Markdown generation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      contentLength: content.length
    })
    throw new Error('Failed to generate Markdown file. Please try again or contact support.')
  }
}

/**
 * Generate a properly formatted DOCX document
 * Note: In a production app, you would use a library like docx.js
 * For this demo, we'll create a simple HTML that can be opened in Word
 */
function generateDOCX(content: string, brandName: string): Promise<Blob> {
  try {
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${brandName} Style Guide</title>
      <style>
        @page Section1 {
          size: 8.5in 11.0in;
          margin: 1.0in;
        }
        div.Section1 { page: Section1; }
        body { 
          font-family: Calibri, Arial, sans-serif;
          line-height: 1.5;
        }
        h1 { font-size: 24pt; color: #333; margin-top: 24pt; }
        h2 { font-size: 18pt; color: #333; margin-top: 18pt; }
        h3 { font-size: 14pt; color: #333; margin-top: 14pt; }
        h4 { font-size: 12pt; color: #333; margin-top: 12pt; }
        p { font-size: 11pt; margin: 6pt 0; }
        ul, ol { margin: 6pt 0; }
        li { margin: 3pt 0; }
        .right { color: green; }
        .wrong { color: red; }
      </style>
    </head>
    <body>
      <div class="Section1">
      <h1>${brandName} Style Guide</h1>
      <p>Created on ${new Date().toLocaleDateString()}</p>
        ${formatContentForDOCX(content)}
      </div>
    </body>
    </html>
  `

  // Return as HTML file instead with a more compatible MIME type
  return Promise.resolve(
    new Blob([html], {
      type: "text/html"
    }),
  )
  } catch (error) {
    console.error('[File Generator] DOCX generation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      brandName,
      contentLength: content.length
    })
    throw new Error('Failed to generate DOCX file. Please try again or contact support.')
  }
}

/**
 * Generate a properly formatted HTML document
 */
function generateHTML(content: string, brandName: string): Promise<Blob> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${brandName} Style Guide</title>
      <style>
        :root {
          color-scheme: light dark;
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
          line-height: 1.6; 
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #24292e;
          background: #ffffff;
        }
        @media (prefers-color-scheme: dark) {
          body {
            color: #c9d1d9;
            background: #0d1117;
          }
          a { color: #58a6ff; }
          .right { color: #3fb950; }
          .wrong { color: #f85149; }
        }
        h1 { font-size: 2.5em; margin-top: 1em; }
        h2 { font-size: 1.8em; margin-top: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
        h3 { font-size: 1.3em; margin-top: 1.2em; }
        h4 { font-size: 1.1em; margin-top: 1.1em; }
        p { margin: 1em 0; }
        ul, ol { margin: 1em 0; padding-left: 2em; }
        li { margin: 0.5em 0; }
        .right { color: #22863a; }
        .wrong { color: #cb2431; }
        .how-to-use-callout { 
          background: #f8f9fa; 
          border: 1px solid #e1e4e8; 
          border-radius: 6px; 
          padding: 16px; 
          margin: 16px 0; 
        }
        @media (prefers-color-scheme: dark) {
          .how-to-use-callout { 
            background: #161b22; 
            border-color: #30363d; 
          }
        }
        hr { 
          border: none; 
          border-top: 1px solid #e1e4e8; 
          margin: 2rem 0; 
        }
        @media (prefers-color-scheme: dark) {
          hr { border-top-color: #30363d; }
        }
        code { font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace; }
        pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
        @media (prefers-color-scheme: dark) {
          pre { background: #161b22; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${brandName} Style Guide</h1>
        <p class="date">Created on ${new Date().toLocaleDateString()}</p>
      </div>
      
      ${content}
    </body>
    </html>
  `

  return Promise.resolve(new Blob([html], { type: "text/html" }))
}

/**
 * Format markdown content for HTML
 */
function formatContentForHTML(content: string): string {
  return content
    // Convert markdown headers
    .replace(/^(#{1,6})\s+(.+)$/gm, (_, level, text) => 
      `<h${level.length}>${text}</h${level.length}>`)
    // Convert bold text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Convert italic text
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Convert bullet points
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Convert numbered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ol>$&</ol>')
    // Convert line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    // Only wrap lines that are not block elements in <p>
    .replace(/^(?!<h\d|<ul>|<ol>|<li>|<\/ul>|<\/ol>|<\/li>|<blockquote>|<pre>|<code>|<table>|<tr>|<td>|<th>|<hr>|<br>)(.+)$/gm, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p>\s*<\/p>/g, '')
    // Clean up nested paragraphs
    .replace(/<p>(\s*<(?:h[1-6]|ul|ol|li|p).*?>)/g, '$1')
    .replace(/(<\/(?:h[1-6]|ul|ol|li|p)>\s*)<\/p>/g, '$1');
}

/**
 * Format markdown content for DOCX
 */
function formatContentForDOCX(content: string): string {
  return content
    // Convert markdown headers to Word styles
    .replace(/^(#{1,6})\s+(.+)$/gm, (_, level, text) => 
      `<h${level.length} style="font-family: Calibri; font-size: ${24 - (level.length * 2)}pt;">${text}</h${level.length}>`)
    // Convert bold text
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    // Convert italic text
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    // Convert bullet points with proper Word styling
    .replace(/^[-*]\s+(.+)$/gm, '<p style="margin-left: 20px;"><span style="font-family: Symbol;">•</span> $1</p>')
    // Convert numbered lists with proper Word styling
    .replace(/^\d+\.\s+(.+)$/gm, '<p style="margin-left: 20px;">$1</p>')
    // Convert line breaks
    .replace(/\n\n/g, '</p><p style="font-family: Calibri; font-size: 11pt;">')
    .replace(/\n/g, '<br>')
    // Add default paragraph styling
    .replace(/^(.+)$/gm, '<p style="font-family: Calibri; font-size: 11pt;">$1</p>')
    // Clean up empty paragraphs
    .replace(/<p[^>]*>\s*<\/p>/g, '')
}

/**
 * Download a generated file
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Generate a file in the specified format with proper MIME type
 */
export async function generateFileWithMimeType(
  format: FileFormat,
  content: string,
): Promise<{ blob: Blob; mimeType: string }> {
  console.log(`Generating ${format} file with content length: ${content.length}`)

  let mimeType = "text/plain"

  // Set the correct mime type based on format
  switch (format) {
    case "pdf":
      mimeType = "application/pdf"
      break
    case "md":
      mimeType = "text/markdown"
      break
    case "docx":
      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      break
    case "html":
      mimeType = "text/html"
      break
  }

  // Create a blob with the appropriate content and MIME type
  const blob = new Blob([content], { type: mimeType })

  return { blob, mimeType }
}
