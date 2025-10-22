// app/api/post-to-webflow/route.js

export async function POST(req) {
      const { title, slug, body } = await req.json();
    
      try {
        const WEBFLOW_TOKEN = process.env.WEBFLOW_API_KEY;
        const COLLECTION_ID = 'YOUR_COLLECTION_ID_HERE'; // replace this with your real one
    
        const response = await fetch(
          `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${WEBFLOW_TOKEN}`,
            },
            body: JSON.stringify({
              isArchived: false,
              isDraft: false,
              fieldData: {
                name: title,
                slug,
                "post-body": body, // change this key to match your CMS field slug
              },
            }),
          }
        );
    
        const data = await response.json();
        return Response.json({ success: true, data });
      } catch (err) {
        console.error(err);
        return Response.json({ success: false, error: err.message }, { status: 500 });
      }
    }
    