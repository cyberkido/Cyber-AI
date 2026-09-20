import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  console.log("KEY EXISTS:", !!process.env.GEMINI_API_KEY);
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const { prompt, message } = req.body;
    const userPrompt = prompt || message;
    if (!userPrompt) return res.status(400).json({ error: "No prompt" });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
    });

    const text = response.text;
    console.log("SUCCESS:", text.slice(0,50));
    return res.status(200).json({ answer: text, reply: text });

  } catch (err) {
    console.error("ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
