import { NextRequest, NextResponse } from "next/server";
import { generateSingleSample, generateBrandVoiceTraits } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { brandDetails, sampleType } = await request.json();

    if (!brandDetails) {
      return NextResponse.json(
        { error: "Brand details are required" },
        { status: 400 }
      );
    }

    console.log("[Generate Samples API] Starting sample generation for:", brandDetails.name);
    
    // Generate traits context if needed
    let traitsContext: string | undefined;
    try {
      const traitsResult = await generateBrandVoiceTraits(brandDetails);
      if (traitsResult.success && traitsResult.content) {
        traitsContext = traitsResult.content;
      }
    } catch (error) {
      console.warn("[Generate Samples API] Could not generate traits context:", error);
    }

    // Generate samples directly from brand details + traits (simplified approach)
    console.log("[Generate Samples API] Using brand details and voice traits for sample generation...");

    // Step 3: Generate content sample(s)
    if (sampleType) {
      // Generate single sample (user-controlled)
      console.log(`[Generate Samples API] Generating ${sampleType} sample...`);
      const sampleResult = await generateSingleSample(
        brandDetails,
        sampleType as 'linkedin' | 'newsletter' | 'blogPost',
        traitsContext
      );

      if (!sampleResult.success) {
        return NextResponse.json(
          { error: sampleResult.error || `Failed to generate ${sampleType} sample` },
          { status: 500 }
        );
      }

      console.log(`[Generate Samples API] ${sampleType} sample generated successfully`);

      return NextResponse.json({
        success: true,
        sampleType,
        content: sampleResult.content
      });

    } else {
      // Batch mode no longer supported - only single sample generation via buttons
      return NextResponse.json(
        { error: "Please specify a sampleType (linkedin, newsletter, or blogPost)" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("[Generate Samples API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
