import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import Logger from '@/lib/logger'

export async function GET() {
  try {
    Logger.info('Testing OpenAI connection')
    
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      Logger.error('OpenAI API key not found')
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey })
    
    // Test with a simple completion
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Say "OpenAI connection successful"' }
      ],
      max_tokens: 20
    })

    const content = response.choices[0]?.message?.content
    Logger.info('OpenAI test successful', { response: content })

    return NextResponse.json({
      success: true,
      message: content
    })
  } catch (error) {
    Logger.error('OpenAI test failed', error instanceof Error ? error : new Error('Unknown error'))
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to OpenAI'
    }, { status: 500 })
  }
} 