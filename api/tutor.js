export default async function handler(req, res) {
  console.log("KEY EXISTS:", !!process.env.GROQ_API_KEY);
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { prompt, message } = req.body;
    const userPrompt = prompt || message;
    if (!userPrompt) return res.status(400).json({ error: "No prompt" });

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
       body: JSON.stringify({
  model: "deepseek-r1-distill-llama-70b", // Updated model name
  messages: [{ role: "user", content: userPrompt }]
        })
      }
    );

    const data = await response.json();
    console.log("GROQ RESPONSE:", JSON.stringify(data).slice(0, 200));

    if (!response.ok) throw new Error(JSON.stringify(data));

    const text = data.choices?.[0]?.message?.content || "No answer";

    return res.status(200).json({ answer: text, reply: text, text: text, response: text, message: text });

  } catch (err) {
    console.error("ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
