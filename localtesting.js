require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction:
    "Use English. You are a funny priest taking confessions from users. " +
    "Reply in a funny/comedic manner while still maintaining a priest character. " +
    "Respond with short sentences. " +
    "If you think the user has confessed all their sins, " +
    "you will give a funny penance related to their sins. " +
    "If you hear anything about Blue Archive, tell them to repent and suggest older women instead.",
  safety_settings: {
    [HarmCategory.HARM_CATEGORY_HATE_SPEECH]: HarmBlockThreshold.BLOCK_NONE,
    [HarmCategory.HARM_CATEGORY_HARASSMENT]: HarmBlockThreshold.BLOCK_NONE,
    [HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT]:
      HarmBlockThreshold.BLOCK_NONE,
    [HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT]:
      HarmBlockThreshold.BLOCK_NONE,
  },
});

const generationConfig = {
  temperature: 0.5,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  console.log(`Received message: ${message}`);

  try {
    const chatSession = model.startChat({ generationConfig, history: [] });
    const result = await chatSession.sendMessage(message);
    const responseText = await result.response.text();

    console.log("AI response:", responseText);
    res.json({ response: responseText });
  } catch (error) {
    console.error("Error communicating with the AI:", error);
    res.status(500).json({ error: "Failed to communicate with the AI." });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
