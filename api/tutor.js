import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const prompt = body.message || body.prompt || "";

    if (!prompt) {
      return Response.json({ error: "No prompt provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "GEMINI_API_KEY not set in Vercel" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // FIXED MODEL - 2.5-flash is dead for new users
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return Response.json({ response: text });

  } catch (error) {
    console.error("API Error:", error);
    // Return 500 with message, not 502
    return Response.json(
      { error: error.message || "Gemini failed" }, 
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get("prompt");
  if (!prompt) return Response.json({ error: "No prompt" }, { status: 400 });
  
  // reuse POST logic
  return POST(new Request(req.url, {
    method: "POST",
    body: JSON.stringify({ prompt }),
  }));
}
