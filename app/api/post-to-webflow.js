export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, slug, body } = req.body;

    // your Webflow token
    const WEBFLOW_TOKEN = process.env.WEBFLOW_API_KEY;
    const COLLECTION_ID = 'YOUR_COLLECTION_ID_HERE'; // replace this

    const response = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBFLOW_TOKEN}`,
      },
      body: JSON.stringify({
        isArchived: false,
        isDraft: false,
        fieldData: {
          name: title,
          slug,
          'post-body': body,
        },
      }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
