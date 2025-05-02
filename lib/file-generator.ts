// File generation utilities for style guide exports
import { jsPDF } from "jspdf"
import "jspdf-autotable"

export type FileFormat = "pdf" | "md" | "docx" | "html"

/**
 * Generate a file in the specified format with the given content
 */
export async function generateFile(format: FileFormat, content: string, brandName: string): Promise<Blob> {
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
}

/**
 * Generate a properly formatted PDF document
 */
async function generatePDF(content: string, brandName: string): Promise<Blob> {
  // Create new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Add title page
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text(`${brandName} Style Guide`, 105, 80, { align: "center" })

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(`Created on ${new Date().toLocaleDateString()}`, 105, 90, { align: "center" })

  doc.addPage()

  // Parse markdown and add to PDF
  const lines = content.split("\n")
  let y = 20
  const margin = 20
  const pageWidth = doc.internal.pageSize.width
  const textWidth = pageWidth - margin * 2

  let currentFont = "normal"
  let currentSize = 12
  let listLevel = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Handle headers
    if (line.startsWith("#")) {
      const level = line.match(/^#+/)[0].length
      const text = line.replace(/^#+\s+/, "")
      
      currentSize = 24 - (level * 2)
      doc.setFontSize(currentSize)
      doc.setFont("helvetica", "bold")
      
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      
      doc.text(text, margin, y)
      y += 10
      continue
    }

    // Handle bullet points
    if (line.match(/^[-*]\s+/)) {
      const text = line.replace(/^[-*]\s+/, "")
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      
      doc.text("•", margin + 5, y)
      const lines = doc.splitTextToSize(text, textWidth - 10)
      doc.text(lines, margin + 10, y)
      y += lines.length * 7
      continue
    }

    // Handle regular text
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    
      if (y > 250) {
        doc.addPage()
        y = 20
      }
    
    // Split long text into lines that fit the page width
    const lines = doc.splitTextToSize(line, textWidth)
    doc.text(lines, margin, y)
    y += lines.length * 7
  }

  return doc.output("blob")
}

/**
 * Generate a properly formatted Markdown document
 */
function generateMarkdown(content: string): Promise<Blob> {
  // Markdown is already in the correct format, just return as blob
  return Promise.resolve(new Blob([content], { type: "text/markdown" }))
}

/**
 * Generate a properly formatted DOCX document
 * Note: In a production app, you would use a library like docx.js
 * For this demo, we'll create a simple HTML that can be opened in Word
 */
function generateDOCX(content: string, brandName: string): Promise<Blob> {
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

  return Promise.resolve(
    new Blob([html], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
  )
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
        .header { text-align: center; margin-bottom: 40px; }
        .date { color: #666; margin-top: 10px; }
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
      
      ${formatContentForHTML(content)}
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
    // Wrap in paragraphs
    .replace(/^(.+)$/gm, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p>\s*<\/p>/g, '')
    // Clean up nested paragraphs
    .replace(/<p>(\s*<(?:h[1-6]|ul|ol|li|p).*?>)/g, '$1')
    .replace(/(<\/(?:h[1-6]|ul|ol|li|p)>\s*)<\/p>/g, '$1')
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
