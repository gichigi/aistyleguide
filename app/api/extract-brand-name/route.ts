import { NextResponse } from 'next/server'
import { extractBrandName } from '@/lib/openai'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { brandDetails } = body
    if (!brandDetails?.brandDetailsText) {
      return NextResponse.json({ success: false, error: 'Missing brandDetailsText' }, { status: 400 })
    }
    const result = await extractBrandName(brandDetails)
    if (!result.success || !result.content) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to extract brand name' }, { status: 500 })
    }
    return NextResponse.json({ success: true, brandName: result.content.trim() })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
} 