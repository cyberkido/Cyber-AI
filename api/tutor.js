export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { prompt } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim()) {
    res.status(400).json({ error: "Missing prompt" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured in this environment");
    res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
    return;
  }

  const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const gRes = await fetch(url, {
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

    const raw = await gRes.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (gRes.status === 429) {
      res.status(429).json({ error: "Rate limited, try again shortly" });
      return;
    }

    if (!gRes.ok) {
      const detail = data?.error?.message || raw || `Gemini returned HTTP ${gRes.status}`;
      console.error("Gemini error:", gRes.status, detail);
      res.status(502).json({ error: "Upstream error", detail });
      return;
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || "").join("").trim();

    if (!text) {
      console.error("Gemini returned no usable content:", raw);
      res.status(502).json({ error: "Gemini returned an empty response" });
      return;
    }

    res.status(200).json({ text });
  } catch (err) {
    console.error("Tutor request failed:", err);
    if (err?.name === "AbortError") {
      res.status(504).json({ error: "Gemini request timed out" });
      return;
    }

    res.status(500).json({ error: "Request failed" });
  } finally {
    clearTimeout(timeout);
  }
}
