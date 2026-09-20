export default async function handler(req, res) {
  console.log("KEY EXISTS:",!!process.env.GEMINI_API_KEY);
  if (req.method!== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { prompt, message } = req.body;
    const userPrompt = prompt || message;
    if (!userPrompt) return res.status(400).json({ error: "No prompt" });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }]
        })
      }
    );

    const data = await response.json();
    console.log("GOOGLE RESPONSE:", JSON.stringify(data).slice(0,200));

    if (!response.ok) throw new Error(JSON.stringify(data));

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No answer";

    return res.status(200).json({ answer: text, reply: text });

  } catch (err) {
    console.error("ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
