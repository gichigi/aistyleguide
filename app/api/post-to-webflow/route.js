// app/api/post-to-webflow/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { title, slug, body, location = "Default Location", category = "68f8ff5305fca0c8ae56ed38", contentSummary = "Default summary" } = await req.json();

    //if (!title || !slug || !body) {
    //  return NextResponse.json({ error: "Missing required fields: title, slug, body" }, { status: 400 });
    //}

    // 1. Your Webflow credentials
    const WEBFLOW_SITE_ID = process.env.WEBFLOW_SITE_ID;
    const WEBFLOW_COLLECTION_ID = process.env.WEBFLOW_COLLECTION_ID;
    const WEBFLOW_TOKEN = process.env.WEBFLOW_TOKEN;

    // 2. Webflow CMS API endpoint
    const endpoint = `https://api.webflow.com/v2/sites/${WEBFLOW_SITE_ID}/collections/${WEBFLOW_COLLECTION_ID}/items`;

    // 3. Create the item
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WEBFLOW_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isArchived: false,
        isDraft: false,
        fieldData: {
          name: title,
          slug: slug,
          content: body,
          location: location,
          category: category,
          "content-summary": contentSummary,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Webflow API error:", data);
      return NextResponse.json({ error: data }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error in /api/post-to-webflow:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
