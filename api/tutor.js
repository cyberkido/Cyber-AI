import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  console.log("KEY EXISTS:", !!process.env.GEMINI_API_KEY);
  
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { prompt, message } = req.body;
    const userPrompt = prompt || message;
    if (!userPrompt) return res.status(400).json({ error: "No prompt" });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    
    console.log("SUCCESS");
    return res.status(200).json({ answer: text, reply: text });

  } catch (err) {
    console.error("ERROR:", err.message);
    return res.status(500).json({ error: err.message, details: String(err) });
  }
}
