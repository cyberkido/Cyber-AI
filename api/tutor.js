export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const prompt = req.body?.prompt;
  if (typeof prompt !== "string" || !prompt.trim()) {
    res.status(400).json({ error: "Missing prompt" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured for this deployment");
    res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
    return;
  }

  const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt.trim() }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      }),
      signal: controller.signal,
    });

    const raw = await upstream.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (upstream.status === 429) {
      res.status(429).json({ error: "Rate limited, try again shortly" });
      return;
    }

    if (!upstream.ok) {
      console.error("Gemini error:", upstream.status, raw);
      res.status(502).json({
        error: "Upstream error",
        // Useful in the browser/Vercel logs without exposing the API key.
        detail: data?.error?.message || `Gemini returned HTTP ${upstream.status}`,
      });
      return;
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((part) => part.text || "").join("").trim();
    if (!text) {
      console.error("Gemini returned no text:", raw);
      res.status(502).json({ error: "Gemini returned an empty response" });
      return;
    }

    res.status(200).json({ text });
  } catch (err) {
    console.error("Tutor request failed:", err);
    res.status(err?.name === "AbortError" ? 504 : 500).json({
      error: err?.name === "AbortError" ? "Gemini request timed out" : "Request failed",
    });
  } finally {
    clearTimeout(timeout);
  }
}
