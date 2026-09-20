export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing prompt" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
    return;
  }

  // Override in Vercel env vars (GEMINI_MODEL) if Google retires this model name
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";

  try {
    const gRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      }),
    });

    if (gRes.status === 429) {
      res.status(429).json({ error: "Rate limited, try again shortly" });
      return;
    }

    if (!gRes.ok) {
      const errText = await gRes.text();
      console.error("Gemini error:", gRes.status, errText);
      res.status(502).json({ error: "Upstream error" });
      return;
    }

    const data = await gRes.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || "").join("").trim() || "No response received.";
    res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Request failed" });
  }
}
