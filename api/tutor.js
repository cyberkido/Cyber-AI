export default async function handler(req, res) {
  console.log("KEY EXISTS:", !!process.env.GROQ_API_KEY);
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { prompt, message } = req.body;
    const userPrompt = prompt || message;
    if (!userPrompt) return res.status(400).json({ error: "No prompt" });

    // System prompt enforcing prerequisites and learning checklist formatting
    const systemInstruction = 
      "You are an expert technical tutor. When providing results or explanations, you must structure your response into three clear parts:\n" +
      "1. **Core Answer:** The direct answer or solution to the prompt.\n" +
      "2. **Prerequisites:** Key concepts, technologies, or foundational knowledge the user needs to understand prior to mastering this topic.\n" +
      "3. **Learning Checklist:** A markdown checklist ([ ]) outlining step-by-step tasks or sub-topics for the user to follow to learn this comprehensively.";

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b", // Active production model
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ]
        })
      }
    );

    const data = await response.json();
    console.log("GROQ RESPONSE:", JSON.stringify(data).slice(0, 200));

    if (!response.ok) throw new Error(JSON.stringify(data));

    const text = data.choices?.[0]?.message?.content || "No answer";

    return res.status(200).json({ 
      answer: text, 
      reply: text, 
      text: text, 
      response: text, 
      message: text 
    });

  } catch (err) {
    console.error("ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
