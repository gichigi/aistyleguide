import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Cache for template content
const templateCache: { [key: string]: string } = {}

// Error types
const ErrorTypes = {
  TEMPLATE_NOT_FOUND: "TEMPLATE_NOT_FOUND",
  INVALID_TEMPLATE_NAME: "INVALID_TEMPLATE_NAME",
  FILE_READ_ERROR: "FILE_READ_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR"
} as const

type ErrorType = typeof ErrorTypes[keyof typeof ErrorTypes]

interface ErrorResponse {
  error: string
  type: ErrorType
  details?: string
  template?: string
}

export async function GET(request: Request) {
  try {
    // Get template name from URL params
    const { searchParams } = new URL(request.url)
    const templateName = searchParams.get("name")

    // Validate template name
    if (!templateName) {
      const error: ErrorResponse = {
        error: "Template name is required",
        type: ErrorTypes.INVALID_TEMPLATE_NAME,
        details: "The 'name' query parameter must be provided"
      }
      console.error("Template loading error:", error)
      return NextResponse.json(error, { status: 400 })
    }

    // Validate template name format
    if (!/^[a-zA-Z0-9_]+$/.test(templateName)) {
      const error: ErrorResponse = {
        error: "Invalid template name format",
        type: ErrorTypes.INVALID_TEMPLATE_NAME,
        details: "Template name can only contain letters, numbers, and underscores",
        template: templateName
      }
      console.error("Template loading error:", error)
      return NextResponse.json(error, { status: 400 })
    }

    // Check if template is in cache
    if (templateCache[templateName]) {
      return NextResponse.json({ content: templateCache[templateName] })
    }

    // Load template file
    const templatePath = path.join(process.cwd(), "templates", `${templateName}.md`)
    
    // Check if file exists
    if (!fs.existsSync(templatePath)) {
      const error: ErrorResponse = {
        error: "Template not found",
        type: ErrorTypes.TEMPLATE_NOT_FOUND,
        details: `The template '${templateName}' does not exist`,
        template: templateName
      }
      console.error("Template loading error:", error)
      return NextResponse.json(error, { status: 404 })
    }

    try {
      const template = await fs.promises.readFile(templatePath, "utf8")
      
      // Cache the template
      templateCache[templateName] = template

      return NextResponse.json({ content: template })
    } catch (readError) {
      const error: ErrorResponse = {
        error: "Failed to read template file",
        type: ErrorTypes.FILE_READ_ERROR,
        details: readError instanceof Error ? readError.message : "Unknown read error",
        template: templateName
      }
      console.error("Template loading error:", error, "\nStack trace:", readError)
      return NextResponse.json(error, { status: 500 })
    }
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: "Unexpected error loading template",
      type: ErrorTypes.UNKNOWN_ERROR,
      details: error instanceof Error ? error.message : "Unknown error occurred"
    }
    console.error("Template loading error:", errorResponse, "\nStack trace:", error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
} 