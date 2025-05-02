import { OpenAI } from "openai"
import Logger from "./logger"

export async function validateApiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  Logger.info("Starting API key validation")
  
  if (!apiKey) {
    Logger.error("API key validation failed", new Error("No API key provided"))
    return { success: false, error: "API key is required" }
  }

  try {
    const openai = new OpenAI({ apiKey })
    
    Logger.debug("Making test API call to OpenAI")
    await openai.chat.completions.create({
      messages: [{ role: "user", content: "test" }],
      model: "gpt-3.5-turbo",
      max_tokens: 1
    })

    Logger.info("API key validation successful")
    return { success: true }
  } catch (error) {
    Logger.error(
      "API key validation failed",
      error instanceof Error ? error : new Error("Unknown error"),
      { apiKeyLength: apiKey.length }
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to validate API key"
    }
  }
} 