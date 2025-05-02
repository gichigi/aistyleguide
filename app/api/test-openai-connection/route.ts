import { NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-utils"
import Logger from "@/lib/logger"
import { getAbsoluteUrl } from "@/lib/url-utils"

export async function GET(request: Request) {
  Logger.info("Starting OpenAI connection test")
  
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    Logger.error("OpenAI connection test failed", new Error("API key not configured"))
    return NextResponse.json(
      {
        success: false,
        error: "OpenAI API key not configured",
      },
      { status: 500 }
    )
  }

  const result = await validateApiKey(apiKey)
  
  if (!result.success) {
    Logger.error("OpenAI connection test failed", new Error(result.error))
    return NextResponse.json(
      {
        success: false,
        error: result.error || "Failed to validate OpenAI API key",
      },
      { status: 500 }
    )
  }

  Logger.info("OpenAI connection test successful")
  return NextResponse.json({
    success: true,
    message: "OpenAI connection successful",
    baseUrl: getAbsoluteUrl("/api", request.url)
  })
}
